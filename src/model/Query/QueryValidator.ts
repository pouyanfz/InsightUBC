/**
 * QueryValidator.ts
 * -----------------
 * Validates the structure, syntax, and semantics of an incoming query.
 *
 * Responsibilities:
 * - Ensure the presence and correctness of WHERE, OPTIONS, and (if present) TRANSFORMATIONS
 * - Verify that only one dataset ID is referenced across the query
 * - Check that all keys match valid fields for the dataset kind (sections or rooms)
 * - Validate syntax and semantics of filter and transformation operators
 *
 * Used by: InsightFacade.ts
 */

import { InsightDatasetKind, InsightError } from "../../controller/IInsightFacade";
import { isValidId } from "../../util/GeneralHelpers";

export default class QueryValidator {
	private static readonly sectionsFields = {
		mfields: ["avg", "pass", "fail", "audit", "year"],
		sfields: ["dept", "id", "instructor", "title", "uuid"],
	};
	private static readonly roomsFields = {
		mfields: ["lat", "lon", "seats"],
		sfields: ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"],
	};
	private static readonly validFilterOps = ["AND", "OR", "NOT", "GT", "LT", "EQ", "IS"];
	private static readonly validApplyOps = ["AVG", "SUM", "MIN", "MAX", "COUNT"];

	// Validates the entire query structure and content
	public static isValidQuery(query: any): boolean {
		if (typeof query !== "object" || query === null) {
			throw new InsightError("invalid query string");
		}
		this.hasValidTopLevelStructure(query);
		this.hasValidOptionsBlock(query.OPTIONS);

		const id: string | null = this.extractDatasetId(query);
		if (!id || !isValidId(id)) {
			throw new InsightError("Dataset references two dataset ids or the id is invalid");
		}
		const kind: string | null = this.getKind(query);
		if (!kind) {
			throw new InsightError("Invalid kind");
		}
		this.areQueryKeysValid(query, kind);
		if ("TRANSFORMATIONS" in query) {
			this.hasValidTransformations(query, kind);
		}
		this.isValidFilter(query.WHERE, kind);
		return true;
	}

	private static hasValidTopLevelStructure(query: any): void {
		const keys = Object.keys(query);
		const maxFields: number = 3;

		if (!keys.includes("WHERE")) throw new InsightError("query missing WHERE");
		if (!keys.includes("OPTIONS")) throw new InsightError("query missing OPTIONS");
		if (keys.includes("TRANSFORMATIONS") && keys.length !== maxFields) {
			throw new InsightError("Query has extra keys at the top level");
		}
		if (!keys.includes("TRANSFORMATIONS") && keys.length !== 2) {
			throw new InsightError("Query has extra keys at the top level");
		}
	}

	private static hasValidOptionsBlock(options: any): void {
		if (typeof options !== "object" || options === null) {
			throw new InsightError("OPTIONS must be an object");
		}
		const keys = Object.keys(options);
		const maxFields: number = 2;

		if (!keys.includes("COLUMNS")) throw new InsightError("query missing COLUMNS");
		const columns = options.COLUMNS;

		if (!Array.isArray(columns) || columns.length === 0 || !columns.every((col) => typeof col === "string")) {
			throw new InsightError("COLUMNS must be non-empty string array");
		}

		if ("ORDER" in options) {
			if (keys.length !== maxFields) throw new InsightError("OPTIONS has extra key(s)");
			this.hasValidOrder(options.ORDER, columns);
		} else {
			if (keys.length !== 1) throw new InsightError("OPTIONS has extra key(s)");
		}
	}

	private static hasValidOrder(order: any, columns: string[]): void {
		if (typeof order === "string") {
			if (!columns.includes(order)) throw new InsightError("ORDER key must be in COLUMNS");
		} else if (typeof order === "object") {
			this.hasValidOrderBlock(order, columns);
		} else {
			throw new InsightError("Invalid ORDER type");
		}
	}

	private static hasValidOrderBlock(order: any, columns: string[]): void {
		const keys = Object.keys(order);
		const maxFields = 2;

		if (!keys.includes("dir")) throw new InsightError("ORDER missing dir");
		if (!keys.includes("keys")) throw new InsightError("ORDER missing key 'keys'");
		if (keys.length !== maxFields) throw new InsightError("Extra keys in ORDER");
		if (order.dir !== "UP" && order.dir !== "DOWN") throw new InsightError("Invalid ORDER dir");

		const orderKeys = order.keys;
		if (!Array.isArray(orderKeys) || orderKeys.length === 0 || !orderKeys.every((key) => typeof key === "string")) {
			throw new InsightError("ORDER keys must be non-empty string array");
		}
		if (!orderKeys.every((key: string) => columns.includes(key))) {
			throw new InsightError("All ORDER keys must be in COLUMNS");
		}
	}

	// Extracts the dataset ID from the query, ensuring only one is used
	public static extractDatasetId(query: any): string | null {
		const ids = new Set<string>();
		for (const key of this.extractAllKeys(query)) {
			const parts = key.split("_");
			if (parts.length === 2) ids.add(parts[0]);
		}
		// console.log("Extracted IDs:", ids);
		return ids.size === 1 ? Array.from(ids)[0] : null;
	}

	// This method was developed with the help of an AI assistant (ChatGPT).
	private static extractAllKeys(obj: any): string[] {
		const keys: string[] = [];
		function recurse(curr: any): void {
			if (typeof curr === "object" && curr !== null) {
				for (const key in curr) {
					if (key === "IS" && typeof curr[key] === "object" && Object.keys(curr[key]).length !== 0) {
						const isKey = Object.keys(curr[key])[0];
						if (isKey.includes("_")) keys.push(isKey);
						continue;
					}
					if (typeof curr[key] === "object") recurse(curr[key]);
					if (key.includes("_")) keys.push(key);
					if (typeof curr[key] === "string" && curr[key].includes("_")) keys.push(curr[key]);
				}
			}
		}
		recurse(obj);
		return keys;
	}

	private static areQueryKeysValid(query: any, kind: string): void {
		const keys = this.extractAllKeys(query);
		const sections = this.sectionsFields.mfields.concat(this.sectionsFields.sfields);
		const rooms = this.roomsFields.mfields.concat(this.roomsFields.sfields);
		const expectedFields = kind === InsightDatasetKind.Sections ? sections : rooms;
		for (const key of keys) {
			const field = key.split("_")[1];
			if (!expectedFields.includes(field)) {
				throw new InsightError("Invalid key: " + key);
			}
		}
	}

	private static getKind(query: any): string | null {
		const sections = this.sectionsFields.mfields.concat(this.sectionsFields.sfields);
		const rooms = this.roomsFields.mfields.concat(this.roomsFields.sfields);
		const keys = this.extractAllKeys(query);
		for (const key of keys) {
			const field = key.split("_")[1];
			if (sections.includes(field)) {
				return InsightDatasetKind.Sections;
			} else if (rooms.includes(field)) {
				return InsightDatasetKind.Rooms;
			}
		}
		return null;
	}

	private static isValidFilter(filter: any, kind: string): void {
		if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
			throw new InsightError("Invalid WHERE");
		}
		if (Object.keys(filter).length === 0) return;
		const keys = Object.keys(filter);
		if (keys.length !== 1) throw new InsightError("WHERE should only have 1 key");
		if (!this.validFilterOps.includes(keys[0])) throw new InsightError("Invalid filter " + keys[0]);
		if (keys.some((k) => k.startsWith("_") || /\s/.test(k))) {
			throw new InsightError("Invalid WHERE");
		}
		this.validateFilterObject(keys[0], filter[keys[0]], kind);
	}

	private static validateFilterObject(op: string, content: any, kind: string): void {
		switch (op) {
			case "AND":
			case "OR":
				if (Array.isArray(content) && content.length > 0) {
					content.every((f) => this.isValidFilter(f, kind));
				} else {
					throw new InsightError("Invalid OR");
				}
				break;
			case "NOT":
				if (!(typeof content === "object" && content !== null && Object.keys(content).length === 1)) {
					throw new InsightError("Invalid NOT");
				} else {
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
				throw new InsightError("Invalid operator " + op);
		}
	}

	private static hasValidTransformations(query: any, kind: string): void {
		const transforms = query.TRANSFORMATIONS;
		const transformKeys = Object.keys(transforms);
		if (!transformKeys.includes("GROUP")) throw new InsightError("TRANSFORMS missing GROUP");
		if (!transformKeys.includes("APPLY")) throw new InsightError("TRANSFORMS missing APPLY");
		if (transformKeys.length !== 2) throw new InsightError("Extra keys in TRANSFORMATIONS");

		const columns: string[] = query.OPTIONS.COLUMNS;
		const groupKeys = transforms.GROUP;
		const apply = transforms.APPLY;
		if (!Array.isArray(groupKeys) || groupKeys.length === 0 || typeof groupKeys[0] !== "string") {
			throw new InsightError("GROUP must be an non-empty string array");
		}
		if (!Array.isArray(apply)) throw new InsightError("APPLY must be an array");
		apply.every((item: any) => this.isValidApplyRule(item, kind, columns));

		if (!this.allUniqueApplyKeys(apply)) throw new InsightError("All keys in APPLY must be unique");
		const applyKeys = apply.map((item: any) => Object.keys(item)[0]);
		for (const col of columns) {
			if (!groupKeys.includes(col) && !applyKeys.includes(col)) {
				throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY if TRANSFORMATIONS is present");
			}
		}
	}

	private static isValidApplyRule(applyRule: any, kind: string, columns: string[]): void {
		const keys = Object.keys(applyRule);
		if (keys.length !== 1) throw new InsightError("Apply rule must have only 1 key");
		const applyKey = keys[0];
		if (applyKey.length === 0) throw new InsightError("Apply key cannot be empty string");
		if (applyKey.includes("_")) throw new InsightError("Apply key cannot contain underscore");

		const tokenKey: any = Object.values(applyRule);
		if (Object.keys(tokenKey).length !== 1 || !Array.isArray(tokenKey) || typeof tokenKey[0] !== "object") {
			throw new InsightError("Apply body must be an object with one key");
		}

		const token = Object.keys(tokenKey[0]);
		const key = Object.values(tokenKey[0]);
		if (token.length !== 1 || typeof token[0] !== "string" || key.length !== 1 || typeof key[0] !== "string") {
			throw new InsightError("Apply body must be an object with one key");
		}

		if (!this.validApplyOps.includes(token[0])) throw new InsightError("Invalid transformation operator");
		if (!columns.includes(applyKey)) throw new InsightError("Apply key is not in columns");
		if (token[0] !== "COUNT") {
			const field = key[0].split("_")[1];
			const validFields =
				kind === InsightDatasetKind.Sections
					? this.sectionsFields.mfields
					: this.roomsFields.mfields;
			if (!validFields.includes(field)) throw new InsightError("Invalid key " + key + "in " + token[0]);
		}
	}

	private static allUniqueApplyKeys(apply: any): boolean {
		const keys = apply.map((item: any) => Object.keys(item)[0]);
		const set = new Set<string>(keys);
		return keys.length === set.size;
	}

	private static isValidMComparator(obj: any, kind: string): void {
		if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
			throw new InsightError("Filter must be an object");
		}
		const keys = Object.keys(obj);
		if (keys.length !== 1) {
			throw new InsightError("Filter must have only 1 key");
		}
		const key = keys[0];
		const val = obj[key];
		const expectedFields =
			kind === InsightDatasetKind.Sections ? this.sectionsFields.mfields : this.roomsFields.mfields;
		if (!expectedFields.includes(key.split("_")[1])) throw new InsightError("Invalid key " + key);
		if (typeof val !== "number") throw new InsightError("Value must be number");
	}

	private static isValidSComparator(obj: any, kind: string): void {
		if (typeof obj !== "object" || obj === null) throw new InsightError("IS must be type object");
		const keys = Object.keys(obj);
		if (keys.length !== 1) throw new InsightError("IS must have only 1 key");
		const key = keys[0];
		const val = obj[key];
		const expectedFields =
			kind === InsightDatasetKind.Sections ? this.sectionsFields.sfields : this.roomsFields.sfields;
		if (!expectedFields.includes(key.split("_")[1])) throw new InsightError("Invalid key " + key);
		if (!this.isValidWildcard(val)) throw new InsightError("Invalid wildcard " + val);
	}

	private static isValidWildcard(str: any): boolean {
		return typeof str === "string" && /^[*]?[^*]*[*]?$/.test(str);
	}
}
