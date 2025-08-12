"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../../controller/IInsightFacade");
const GeneralHelpers_1 = require("../../util/GeneralHelpers");
class QueryValidator {
    static sectionsFields = {
        mfields: ["avg", "pass", "fail", "audit", "year"],
        sfields: ["dept", "id", "instructor", "title", "uuid"],
    };
    static roomsFields = {
        mfields: ["lat", "lon", "seats"],
        sfields: ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"],
    };
    static validFilterOps = ["AND", "OR", "NOT", "GT", "LT", "EQ", "IS"];
    static validApplyOps = ["AVG", "SUM", "MIN", "MAX", "COUNT"];
    static isValidQuery(query) {
        if (typeof query !== "object" || query === null) {
            throw new IInsightFacade_1.InsightError("invalid query string");
        }
        this.hasValidTopLevelStructure(query);
        this.hasValidOptionsBlock(query.OPTIONS);
        const id = this.extractDatasetId(query);
        if (!id || !(0, GeneralHelpers_1.isValidId)(id)) {
            throw new IInsightFacade_1.InsightError("Dataset references two dataset ids or the id is invalid");
        }
        const kind = this.getKind(query);
        if (!kind) {
            throw new IInsightFacade_1.InsightError("Invalid kind");
        }
        this.areQueryKeysValid(query, kind);
        if ("TRANSFORMATIONS" in query) {
            this.hasValidTransformations(query, kind);
        }
        this.isValidFilter(query.WHERE, kind);
        return true;
    }
    static hasValidTopLevelStructure(query) {
        const keys = Object.keys(query);
        const maxFields = 3;
        if (!keys.includes("WHERE"))
            throw new IInsightFacade_1.InsightError("query missing WHERE");
        if (!keys.includes("OPTIONS"))
            throw new IInsightFacade_1.InsightError("query missing OPTIONS");
        if (keys.includes("TRANSFORMATIONS") && keys.length !== maxFields) {
            throw new IInsightFacade_1.InsightError("Query has extra keys at the top level");
        }
        if (!keys.includes("TRANSFORMATIONS") && keys.length !== 2) {
            throw new IInsightFacade_1.InsightError("Query has extra keys at the top level");
        }
    }
    static hasValidOptionsBlock(options) {
        if (typeof options !== "object" || options === null) {
            throw new IInsightFacade_1.InsightError("OPTIONS must be an object");
        }
        const keys = Object.keys(options);
        const maxFields = 2;
        if (!keys.includes("COLUMNS"))
            throw new IInsightFacade_1.InsightError("query missing COLUMNS");
        const columns = options.COLUMNS;
        if (!Array.isArray(columns) || columns.length === 0 || !columns.every((col) => typeof col === "string")) {
            throw new IInsightFacade_1.InsightError("COLUMNS must be non-empty string array");
        }
        if ("ORDER" in options) {
            if (keys.length !== maxFields)
                throw new IInsightFacade_1.InsightError("OPTIONS has extra key(s)");
            this.hasValidOrder(options.ORDER, columns);
        }
        else {
            if (keys.length !== 1)
                throw new IInsightFacade_1.InsightError("OPTIONS has extra key(s)");
        }
    }
    static hasValidOrder(order, columns) {
        if (typeof order === "string") {
            if (!columns.includes(order))
                throw new IInsightFacade_1.InsightError("ORDER key must be in COLUMNS");
        }
        else if (typeof order === "object") {
            this.hasValidOrderBlock(order, columns);
        }
        else {
            throw new IInsightFacade_1.InsightError("Invalid ORDER type");
        }
    }
    static hasValidOrderBlock(order, columns) {
        const keys = Object.keys(order);
        const maxFields = 2;
        if (!keys.includes("dir"))
            throw new IInsightFacade_1.InsightError("ORDER missing dir");
        if (!keys.includes("keys"))
            throw new IInsightFacade_1.InsightError("ORDER missing key 'keys'");
        if (keys.length !== maxFields)
            throw new IInsightFacade_1.InsightError("Extra keys in ORDER");
        if (order.dir !== "UP" && order.dir !== "DOWN")
            throw new IInsightFacade_1.InsightError("Invalid ORDER dir");
        const orderKeys = order.keys;
        if (!Array.isArray(orderKeys) || orderKeys.length === 0 || !orderKeys.every((key) => typeof key === "string")) {
            throw new IInsightFacade_1.InsightError("ORDER keys must be non-empty string array");
        }
        if (!orderKeys.every((key) => columns.includes(key))) {
            throw new IInsightFacade_1.InsightError("All ORDER keys must be in COLUMNS");
        }
    }
    static extractDatasetId(query) {
        const ids = new Set();
        for (const key of this.extractAllKeys(query)) {
            const parts = key.split("_");
            if (parts.length === 2)
                ids.add(parts[0]);
        }
        return ids.size === 1 ? Array.from(ids)[0] : null;
    }
    static extractAllKeys(obj) {
        const keys = [];
        function recurse(curr) {
            if (typeof curr === "object" && curr !== null) {
                for (const key in curr) {
                    if (key === "IS" && typeof curr[key] === "object" && Object.keys(curr[key]).length !== 0) {
                        const isKey = Object.keys(curr[key])[0];
                        if (isKey.includes("_"))
                            keys.push(isKey);
                        continue;
                    }
                    if (typeof curr[key] === "object")
                        recurse(curr[key]);
                    if (key.includes("_"))
                        keys.push(key);
                    if (typeof curr[key] === "string" && curr[key].includes("_"))
                        keys.push(curr[key]);
                }
            }
        }
        recurse(obj);
        return keys;
    }
    static areQueryKeysValid(query, kind) {
        const keys = this.extractAllKeys(query);
        const sections = this.sectionsFields.mfields.concat(this.sectionsFields.sfields);
        const rooms = this.roomsFields.mfields.concat(this.roomsFields.sfields);
        const expectedFields = kind === IInsightFacade_1.InsightDatasetKind.Sections ? sections : rooms;
        for (const key of keys) {
            const field = key.split("_")[1];
            if (!expectedFields.includes(field)) {
                throw new IInsightFacade_1.InsightError("Invalid key: " + key);
            }
        }
    }
    static getKind(query) {
        const sections = this.sectionsFields.mfields.concat(this.sectionsFields.sfields);
        const rooms = this.roomsFields.mfields.concat(this.roomsFields.sfields);
        const keys = this.extractAllKeys(query);
        for (const key of keys) {
            const field = key.split("_")[1];
            if (sections.includes(field)) {
                return IInsightFacade_1.InsightDatasetKind.Sections;
            }
            else if (rooms.includes(field)) {
                return IInsightFacade_1.InsightDatasetKind.Rooms;
            }
        }
        return null;
    }
    static isValidFilter(filter, kind) {
        if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
            throw new IInsightFacade_1.InsightError("Invalid WHERE");
        }
        if (Object.keys(filter).length === 0)
            return;
        const keys = Object.keys(filter);
        if (keys.length !== 1)
            throw new IInsightFacade_1.InsightError("WHERE should only have 1 key");
        if (!this.validFilterOps.includes(keys[0]))
            throw new IInsightFacade_1.InsightError("Invalid filter " + keys[0]);
        if (keys.some((k) => k.startsWith("_") || /\s/.test(k))) {
            throw new IInsightFacade_1.InsightError("Invalid WHERE");
        }
        this.validateFilterObject(keys[0], filter[keys[0]], kind);
    }
    static validateFilterObject(op, content, kind) {
        switch (op) {
            case "AND":
            case "OR":
                if (Array.isArray(content) && content.length > 0) {
                    content.every((f) => this.isValidFilter(f, kind));
                }
                else {
                    throw new IInsightFacade_1.InsightError("Invalid OR");
                }
                break;
            case "NOT":
                if (!(typeof content === "object" && content !== null && Object.keys(content).length === 1)) {
                    throw new IInsightFacade_1.InsightError("Invalid NOT");
                }
                else {
                    this.isValidFilter(content, kind);
                }
                break;
            case "GT":
            case "LT":
            case "EQ":
                this.isValidMComparator(content, kind);
                break;
            case "IS":
                this.isValidSComparator(content, kind);
                break;
            default:
                throw new IInsightFacade_1.InsightError("Invalid operator " + op);
        }
    }
    static hasValidTransformations(query, kind) {
        const transforms = query.TRANSFORMATIONS;
        const transformKeys = Object.keys(transforms);
        if (!transformKeys.includes("GROUP"))
            throw new IInsightFacade_1.InsightError("TRANSFORMS missing GROUP");
        if (!transformKeys.includes("APPLY"))
            throw new IInsightFacade_1.InsightError("TRANSFORMS missing APPLY");
        if (transformKeys.length !== 2)
            throw new IInsightFacade_1.InsightError("Extra keys in TRANSFORMATIONS");
        const columns = query.OPTIONS.COLUMNS;
        const groupKeys = transforms.GROUP;
        const apply = transforms.APPLY;
        if (!Array.isArray(groupKeys) || groupKeys.length === 0 || typeof groupKeys[0] !== "string") {
            throw new IInsightFacade_1.InsightError("GROUP must be an non-empty string array");
        }
        if (!Array.isArray(apply))
            throw new IInsightFacade_1.InsightError("APPLY must be an array");
        apply.every((item) => this.isValidApplyRule(item, kind, columns));
        if (!this.allUniqueApplyKeys(apply))
            throw new IInsightFacade_1.InsightError("All keys in APPLY must be unique");
        const applyKeys = apply.map((item) => Object.keys(item)[0]);
        for (const col of columns) {
            if (!(groupKeys.includes(col)) && !(applyKeys.includes(col))) {
                throw new IInsightFacade_1.InsightError("Keys in COLUMNS must be in GROUP or APPLY if TRANSFORMATIONS is present");
            }
        }
    }
    static isValidApplyRule(applyRule, kind, columns) {
        const keys = Object.keys(applyRule);
        if (keys.length !== 1)
            throw new IInsightFacade_1.InsightError("Apply rule must have only 1 key");
        const applyKey = keys[0];
        if (applyKey.length === 0)
            throw new IInsightFacade_1.InsightError("Apply key cannot be empty string");
        if (applyKey.includes("_"))
            throw new IInsightFacade_1.InsightError("Apply key cannot contain underscore");
        const tokenKey = Object.values(applyRule);
        if (Object.keys(tokenKey).length !== 1 || !Array.isArray(tokenKey) || typeof tokenKey[0] !== "object") {
            throw new IInsightFacade_1.InsightError("Apply body must be an object with one key");
        }
        const token = Object.keys(tokenKey[0]);
        const key = Object.values(tokenKey[0]);
        if (token.length !== 1 || typeof token[0] !== "string" || key.length !== 1 || typeof key[0] !== "string") {
            throw new IInsightFacade_1.InsightError("Apply body must be an object with one key");
        }
        if (!this.validApplyOps.includes(token[0]))
            throw new IInsightFacade_1.InsightError("Invalid transformation operator");
        if (!columns.includes(applyKey))
            throw new IInsightFacade_1.InsightError("Apply key is not in columns");
        if (token[0] !== "COUNT") {
            const field = key[0].split("_")[1];
            const validFields = kind === IInsightFacade_1.InsightDatasetKind.Sections ?
                this.sectionsFields.mfields : this.roomsFields.mfields;
            if (!validFields.includes(field))
                throw new IInsightFacade_1.InsightError("Invalid key " + key + "in " + token[0]);
        }
    }
    static allUniqueApplyKeys(apply) {
        const keys = apply.map((item) => Object.keys(item)[0]);
        const set = new Set(keys);
        return keys.length === set.size;
    }
    static isValidMComparator(obj, kind) {
        if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
            throw new IInsightFacade_1.InsightError("Filter must be an object");
        }
        const keys = Object.keys(obj);
        if (keys.length !== 1) {
            throw new IInsightFacade_1.InsightError("Filter must have only 1 key");
        }
        const key = keys[0];
        const val = obj[key];
        const expectedFields = (kind === IInsightFacade_1.InsightDatasetKind.Sections) ?
            this.sectionsFields.mfields : this.roomsFields.mfields;
        if (!expectedFields.includes(key.split("_")[1]))
            throw new IInsightFacade_1.InsightError("Invalid key " + key);
        if (typeof val !== "number")
            throw new IInsightFacade_1.InsightError("Value must be number");
    }
    static isValidSComparator(obj, kind) {
        if (typeof obj !== "object" || obj === null)
            throw new IInsightFacade_1.InsightError("IS must be type object");
        const keys = Object.keys(obj);
        if (keys.length !== 1)
            throw new IInsightFacade_1.InsightError("IS must have only 1 key");
        const key = keys[0];
        const val = obj[key];
        const expectedFields = (kind === IInsightFacade_1.InsightDatasetKind.Sections) ?
            this.sectionsFields.sfields : this.roomsFields.sfields;
        if (!expectedFields.includes(key.split("_")[1]))
            throw new IInsightFacade_1.InsightError("Invalid key " + key);
        if (!this.isValidWildcard(val))
            throw new IInsightFacade_1.InsightError("Invalid wildcard " + val);
    }
    static isValidWildcard(str) {
        return typeof str === "string" && /^[*]?[^*]*[*]?$/.test(str);
    }
}
exports.default = QueryValidator;
//# sourceMappingURL=QueryValidator.js.map