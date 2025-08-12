/**
 * RoomsDataset.ts
 * ---------------
 * Represents a dataset of UBC rooms, structured as:
 * - a unique dataset ID
 * - a dataset kind (rooms)
 * - a list of validated room entries (InsightResult[])
 *
 * Responsibilities:
 * - Store and return validated room entries
 * - Validate presence of all required room fields
 * - Provide metadata such as ID, kind, and row count
 *
 * Used by: RoomDatasetParser.ts, DiskUtil.ts
 */

import IDataset from "../IDataset";
import { InsightDatasetKind, InsightError, InsightResult } from "../../../controller/IInsightFacade";
import { isValidId } from "../../../util/GeneralHelpers";

export default class RoomsDataset extends IDataset {
	constructor(
		public readonly id: string,
		public readonly kind: InsightDatasetKind,
		rows: InsightResult[]
	) {
		super(id, kind, rows);

		if (!isValidId(id)) {
			throw new InsightError("Dataset: invalid id=" + id);
		}

		if (!this.isValidRooms(rows)) {
			throw new InsightError("Dataset: invalid rooms");
		}
	}

	private isValidRooms(rooms: InsightResult[]): boolean {
		const requiredFields = [
			"fullname",
			"shortname",
			"number",
			"name",
			"address",
			"lat",
			"lon",
			"seats",
			"type",
			"furniture",
			"href",
		];

		for (const r of rooms) {
			for (const field of requiredFields) {
				const prefixed = `${this.id}_${field}`;
				if (r[prefixed] === undefined || r[prefixed] === null) {
					return false;
				}
			}
		}
		return true;
	}
	public getRooms(): InsightResult[] {
		return this.rows;
	}
}
