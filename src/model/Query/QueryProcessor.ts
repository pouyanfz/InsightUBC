/**
 * QueryProcessor.ts
 * -----------------
 * Executes validated queries against a dataset of sections or rooms.
 *
 * Responsibilities:
 * - Apply WHERE filters (supports AND, OR, NOT, GT, LT, EQ, IS)
 * - Apply TRANSFORMATIONS (GROUP and APPLY logic)
 * - Format final output using COLUMNS
 * - Apply sorting via ORDER (both simple and multi-key)
 *
 * Input: array of InsightResult entries
 * Output: array of filtered, transformed, and formatted InsightResult entries
 *
 * Used by: InsightFacade.ts
 */

import { InsightResult } from "../../controller/IInsightFacade";
import Decimal from "decimal.js";

const filterFunctions: Record<string, Function> = {
	AND: handleAnd,
	OR: handleOr,
	NOT: handleNot,
	GT: handleGT,
	LT: handleLT,
	EQ: handleEQ,
	IS: handleIS,
};

const applyFunctions: Record<string, Function> = {
	AVG: handleAvg,
	SUM: handleSum,
	MIN: handleMin,
	MAX: handleMax,
	COUNT: handleCount,
};

export function applyWhere(where: any, sections: InsightResult[]): boolean[] {
	if (Object.keys(where).length === 0) {
		return sections.map(() => true);
	}
	const filter = Object.keys(where)[0];
	return filterFunctions[filter](where[filter], sections);
}

export function applyTransformations(transforms: any, rows: InsightResult[]): InsightResult[] {
	const groupby: string[] = transforms.GROUP;
	const groups: Record<string, InsightResult[]> = {};
	for (const row of rows) {
		const groupKey = getGroupKey(row, groupby);
		if (!groups[groupKey]) {
			groups[groupKey] = [row];
		} else {
			groups[groupKey].push(row);
		}
	}
	return handleApply(groups, transforms.APPLY);
}

function getGroupKey(row: InsightResult, groupby: string[]): string {
	let groupKey = "";
	for (const group of groupby) {
		groupKey += row[group].toString() + "__";
	}
	return groupKey.slice(0, -1);
}

function handleApply(groups: Record<string, InsightResult[]>, apply: any): InsightResult[] {
	const applyResult: InsightResult[] = [];
	for (const rows of Object.values(groups)) {
		const applyObj = getApplyValues(apply, rows);
		const groupVals = rows[0];
		applyResult.push({ ...groupVals, ...applyObj });
	}
	return applyResult;
}

function getApplyValues(apply: any, rows: InsightResult[]): object {
	const applyVals: Record<string, number> = {};
	for (const applyRule of apply) {
		const applyKey = Object.keys(applyRule)[0];
		const applyPair = Object.values(applyRule)[0];
		const [token, key] = Object.entries(applyPair as any)[0];
		applyVals[applyKey] = applyFunctions[token](key, rows);
	}
	return applyVals;
}

export function applyOptions(options: any, insight: InsightResult[]): InsightResult[] {
	const columnsResult: InsightResult[] = applyColumns(options.COLUMNS, insight);
	if ("ORDER" in options) {
		return applyOrder(options.ORDER, columnsResult);
	}
	return columnsResult;
}

export function applyColumns(columns: string[], insight: InsightResult[]): InsightResult[] {
	return insight.map((item) => {
		const result: InsightResult = {};
		for (const col of columns) {
			result[col] = item[col];
		}
		return result;
	});
}

export function applyOrder(order: any, insight: InsightResult[]): InsightResult[] {
	if (typeof order === "string") {
		return applyOrderString(order, insight);
	} else {
		return applyOrderBlock(order, insight);
	}
}

function applyOrderString(order: string, insight: InsightResult[]): InsightResult[] {
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

function applyOrderBlock(order: any, insight: InsightResult[]): InsightResult[] {
	const direction = order.dir === "UP" ? 1 : -1;
	return insight.sort((a, b) => {
		return direction * orderBlockSort(a, b, order.keys);
	});
}

function orderBlockSort(a: InsightResult, b: InsightResult, keys: string[]): number {
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

function handleAnd(filters: any[], sections: InsightResult[]): boolean[] {
	let result: boolean[] = Array(sections.length).fill(true);
	for (const f of filters) {
		const fResult = applyWhere(f, sections);
		result = result.map((item, index) => result[index] && fResult[index]);
	}
	return result;
}

function handleOr(filters: any[], sections: InsightResult[]): boolean[] {
	let result: boolean[] = Array(sections.length).fill(false);
	for (const f of filters) {
		const fResult = applyWhere(f, sections);
		result = result.map((item, index) => result[index] || fResult[index]);
	}
	return result;
}

function handleNot(filters: any[], sections: InsightResult[]): boolean[] {
	const result = applyWhere(filters, sections);
	return result.map((item) => !item);
}

function handleGT(filters: any, sections: InsightResult[]): boolean[] {
	const key = Object.keys(filters)[0];
	const value = filters[key];
	return sections.map((item) => (item[key] as number) > value);
}

function handleLT(filters: any, sections: InsightResult[]): boolean[] {
	const key = Object.keys(filters)[0];
	const value = filters[key];
	return sections.map((item) => (item[key] as number) < value);
}

function handleEQ(filters: any, sections: InsightResult[]): boolean[] {
	const key = Object.keys(filters)[0];
	const value = filters[key];
	return sections.map((item) => (item[key] as number) === value);
}

function handleIS(filters: any, sections: InsightResult[]): boolean[] {
	const key = Object.keys(filters)[0];
	const value = filters[key];

	return sections.map((section) => {
		const field = section[key];
		if (typeof field !== "string" || typeof value !== "string") {
			return false;
		}

		// Exact match without wildcards
		if (!value.includes("*")) {
			return field === value;
		}

		// Handle wildcards
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
		} else if (startsWithWildcard) {
			return field.endsWith(trimmed);
		} else if (endsWithWildcard) {
			return field.startsWith(trimmed);
		}

		return false;
	});
}

function handleSum(key: string, rows: InsightResult[]): number {
	const nums = rows.map((item: InsightResult) => new Decimal(item[key]));
	let sum = new Decimal(0);
	for (const num of nums) {
		sum = Decimal.add(sum, num);
	}
	return Number(sum.toFixed(2));
}

function handleAvg(key: string, rows: InsightResult[]): number {
	const nums = rows.map((item: InsightResult) => new Decimal(item[key]));
	let sum = new Decimal(0);
	for (const num of nums) {
		sum = Decimal.add(sum, num);
	}
	const avg = sum.toNumber() / rows.length;
	return Number(avg.toFixed(2));
}

function handleMin(key: string, rows: InsightResult[]): number {
	const nums: number[] = rows.map((item: InsightResult) => Number(item[key]));
	return Math.min(...nums);
}

function handleMax(key: string, rows: InsightResult[]): number {
	const nums: number[] = rows.map((item: InsightResult) => Number(item[key]));
	return Math.max(...nums);
}

function handleCount(key: string, rows: InsightResult[]): number {
	const vals = rows.map((item: InsightResult) => item[key]);
	const uniques = [...new Set(vals)];
	return uniques.length;
}
