/**
 * SectionsDataset.ts
 * ------------------
 * Represents a dataset for course sections.
 *
 * Responsibilities:
 * - Store metadata (dataset ID and kind)
 * - Contain a list of validated section rows
 * - Provide row count via inherited functionality
 * - Validate section data on instantiation
 *
 * Used by: DiskUtil.ts, DatasetParser.ts
 */

import IDataset from "../IDataset";
import { InsightDatasetKind, InsightError, InsightResult } from "../../../controller/IInsightFacade";
import { isValidId } from "../../../util/GeneralHelpers";

const mfields = ["avg", "pass", "fail", "audit", "year"];
const sfields = ["dept", "id", "instructor", "title", "uuid"];

export default class SectionsDataset extends IDataset {
	constructor(
		public readonly id: string,
		public readonly kind: InsightDatasetKind,
		rows: InsightResult[]
	) {
		super(id, kind, rows);
		if (!isValidId(id)) {
			throw new InsightError("Dataset: invalid id=" + id);
		}

		if (!this.isValidSections(rows)) {
			throw new InsightError("Dataset: invalid sections");
		}
	}

	private isValidSections(sections: any): boolean {
		const requiredFields = mfields.concat(sfields).map((item) => this.id + "_" + item);
		for (const s of sections) {
			for (const field of requiredFields) {
				if (!(field in s)) {
					return false;
				}
			}
		}
		return true;
	}
}
