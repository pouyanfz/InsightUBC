/**
 * IDataset.ts
 * -----------
 * Abstract base class for all dataset types (sections or rooms).
 *
 * Responsibilities:
 * - Store common properties: `id`, `kind`, and `rows`
 * - Provide shared behavior for:
 *    - Accessing row count (`numRows`)
 *    - Serializing the dataset to disk format (`toDiskFormat`)
 *    - Accessing dataset entries (`rows`)
 *
 * Notes:
 * - Intended to be extended by concrete dataset classes
 *
 * Implemented by: SectionsDataset.ts, RoomsDataset.ts
 * Used by: InsightFacade.ts, SectionsDataset.ts, RoomsDataset.ts, DatasetParser.ts, DiskUtil.ts

 */

import { InsightDatasetKind, InsightResult } from "../../controller/IInsightFacade";

export default abstract class IDataset {
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly rows: InsightResult[];

	constructor(id: string, kind: InsightDatasetKind, rows: InsightResult[]) {
		this.id = id;
		this.kind = kind;
		this.rows = rows;
	}

	public get numRows(): number {
		return this.rows.length;
	}

	public toDiskFormat(): any {
		return {
			id: this.id,
			kind: this.kind,
			rows: this.rows,
		};
	}
}
