"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyWhere = applyWhere;
exports.applyTransformations = applyTransformations;
exports.applyOptions = applyOptions;
exports.applyColumns = applyColumns;
exports.applyOrder = applyOrder;
const decimal_js_1 = __importDefault(require("decimal.js"));
const filterFunctions = {
    AND: handleAnd,
    OR: handleOr,
    NOT: handleNot,
    GT: handleGT,
    LT: handleLT,
    EQ: handleEQ,
    IS: handleIS,
};
const applyFunctions = {
    AVG: handleAvg,
    SUM: handleSum,
    MIN: handleMin,
    MAX: handleMax,
    COUNT: handleCount,
};
function applyWhere(where, sections) {
    if (Object.keys(where).length === 0) {
        return sections.map(() => true);
    }
    const filter = Object.keys(where)[0];
    return filterFunctions[filter](where[filter], sections);
}
function applyTransformations(transforms, rows) {
    const groupby = transforms.GROUP;
    const groups = {};
    for (const row of rows) {
        const groupKey = getGroupKey(row, groupby);
        if (!groups[groupKey]) {
            groups[groupKey] = [row];
        }
        else {
            groups[groupKey].push(row);
        }
    }
    return handleApply(groups, transforms.APPLY);
}
function getGroupKey(row, groupby) {
    let groupKey = "";
    for (const group of groupby) {
        groupKey += row[group].toString() + "__";
    }
    return groupKey.slice(0, -1);
}
function handleApply(groups, apply) {
    const applyResult = [];
    for (const rows of Object.values(groups)) {
        const applyObj = getApplyValues(apply, rows);
        const groupVals = rows[0];
        applyResult.push({ ...groupVals, ...applyObj });
    }
    return applyResult;
}
function getApplyValues(apply, rows) {
    const applyVals = {};
    for (const applyRule of apply) {
        const applyKey = Object.keys(applyRule)[0];
        const applyPair = Object.values(applyRule)[0];
        const [token, key] = Object.entries(applyPair)[0];
        applyVals[applyKey] = applyFunctions[token](key, rows);
    }
    return applyVals;
}
function applyOptions(options, insight) {
    const columnsResult = applyColumns(options.COLUMNS, insight);
    if ("ORDER" in options) {
        return applyOrder(options.ORDER, columnsResult);
    }
    return columnsResult;
}
function applyColumns(columns, insight) {
    return insight.map((item) => {
        const result = {};
        for (const col of columns) {
            result[col] = item[col];
        }
        return result;
    });
}
function applyOrder(order, insight) {
    if (typeof order === "string") {
        return applyOrderString(order, insight);
    }
    else {
        return applyOrderBlock(order, insight);
    }
}
function applyOrderString(order, insight) {
    return insight.sort((a, b) => {
        const aVal = a[order];
        const bVal = b[order];
        if (aVal > bVal) {
            return 1;
        }
        if (aVal < bVal) {
            return -1;
        }
        return 0;
    });
}
function applyOrderBlock(order, insight) {
    const direction = order.dir === "UP" ? 1 : -1;
    return insight.sort((a, b) => {
        return direction * orderBlockSort(a, b, order.keys);
    });
}
function orderBlockSort(a, b, keys) {
    const key = keys[0];
    const numKeys = keys.length;
    const aVal = a[key];
    const bVal = b[key];
    if (aVal > bVal) {
        return 1;
    }
    if (aVal < bVal) {
        return -1;
    }
    return numKeys === 1 ? 0 : orderBlockSort(a, b, keys.slice(1));
}
function handleAnd(filters, sections) {
    let result = Array(sections.length).fill(true);
    for (const f of filters) {
        const fResult = applyWhere(f, sections);
        result = result.map((item, index) => result[index] && fResult[index]);
    }
    return result;
}
function handleOr(filters, sections) {
    let result = Array(sections.length).fill(false);
    for (const f of filters) {
        const fResult = applyWhere(f, sections);
        result = result.map((item, index) => result[index] || fResult[index]);
    }
    return result;
}
function handleNot(filters, sections) {
    const result = applyWhere(filters, sections);
    return result.map((item) => !item);
}
function handleGT(filters, sections) {
    const key = Object.keys(filters)[0];
    const value = filters[key];
    return sections.map((item) => item[key] > value);
}
function handleLT(filters, sections) {
    const key = Object.keys(filters)[0];
    const value = filters[key];
    return sections.map((item) => item[key] < value);
}
function handleEQ(filters, sections) {
    const key = Object.keys(filters)[0];
    const value = filters[key];
    return sections.map((item) => item[key] === value);
}
function handleIS(filters, sections) {
    const key = Object.keys(filters)[0];
    const value = filters[key];
    return sections.map((section) => {
        const field = section[key];
        if (typeof field !== "string" || typeof value !== "string") {
            return false;
        }
        if (!value.includes("*")) {
            return field === value;
        }
        const startsWithWildcard = value.startsWith("*");
        const endsWithWildcard = value.endsWith("*");
        let trimmed = value;
        if (startsWithWildcard) {
            trimmed = trimmed.slice(1);
        }
        if (endsWithWildcard) {
            trimmed = trimmed.slice(0, -1);
        }
        if (startsWithWildcard && endsWithWildcard) {
            return field.includes(trimmed);
        }
        else if (startsWithWildcard) {
            return field.endsWith(trimmed);
        }
        else if (endsWithWildcard) {
            return field.startsWith(trimmed);
        }
        return false;
    });
}
function handleSum(key, rows) {
    const nums = rows.map((item) => new decimal_js_1.default(item[key]));
    let sum = new decimal_js_1.default(0);
    for (const num of nums) {
        sum = decimal_js_1.default.add(sum, num);
    }
    return Number(sum.toFixed(2));
}
function handleAvg(key, rows) {
    const nums = rows.map((item) => new decimal_js_1.default(item[key]));
    let sum = new decimal_js_1.default(0);
    for (const num of nums) {
        sum = decimal_js_1.default.add(sum, num);
    }
    const avg = sum.toNumber() / rows.length;
    return Number(avg.toFixed(2));
}
function handleMin(key, rows) {
    const nums = rows.map((item) => Number(item[key]));
    return Math.min(...nums);
}
function handleMax(key, rows) {
    const nums = rows.map((item) => Number(item[key]));
    return Math.max(...nums);
}
function handleCount(key, rows) {
    const vals = rows.map((item) => item[key]);
    const uniques = [...new Set(vals)];
    return uniques.length;
}
//# sourceMappingURL=QueryProcessor.js.map