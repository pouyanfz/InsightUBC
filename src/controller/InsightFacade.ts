import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import { isValidId } from "../util/GeneralHelpers";
import { deleteDatasetFile, idExists, loadDataset, readDatasetInfo, readIds, saveDataset } from "../util/DiskUtil";
import { parseDataset } from "../model/Dataset/CourseDataset/DatasetParser";
import QueryValidator from "../model/Query/QueryValidator";
import IDataset from "../model/Dataset/IDataset";
import { applyOptions, applyTransformations, applyWhere } from "../model/Query/QueryProcessor";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	private datasetCollection: Record<string, IDataset>;
	private rowLimit = 5000;

	constructor() {
		this.datasetCollection = {};
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!isValidId(id)) {
			throw new InsightError();
		}
		if (await idExists(id)) {
			throw new InsightError();
		}

		const dataset = await parseDataset(id, content, kind);
		if (dataset.numRows === 0) {
			throw new InsightError("No valid sections found in dataset");
		}
		await saveDataset(dataset);

		return readIds();
	}

	public async removeDataset(id: string): Promise<string> {
		if (!isValidId(id)) {
			throw new InsightError("removeDataset: id given is not valid - id=" + id);
		}
		if (!(await idExists(id))) {
			throw new NotFoundError("removeDataset: dataset with id does not exist - id=" + id);
		}
		await deleteDatasetFile(id);
		return id;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		try {
			QueryValidator.isValidQuery(query);
		} catch (error) {
			if (error instanceof InsightError) throw new InsightError("performQuery: " + error.message);
			else throw new Error("performQuery: unexpected error");
		}

		const id = QueryValidator.extractDatasetId(query);

		if (!id) {
			throw new InsightError("performQuery: query references multiple dataset ids");
		}

		if (!this.datasetCollection[id]) {
			if (!(await idExists(id))) {
				throw new InsightError("performQuery: id=" + id + " does not exist");
			}
			const dataset = await loadDataset(id);
			if (!dataset) {
				throw new InsightError("performQuery: dataset is null or unreadable");
			}
			this.datasetCollection[id] = dataset;
		}

		const dataset = this.datasetCollection[id];
		const rows = dataset.rows;
		const whereBoolean: boolean[] = applyWhere((query as any).WHERE, rows);
		let result: InsightResult[] = rows.filter((item, index) => whereBoolean[index]);
		if ("TRANSFORMATIONS" in (query as any)) {
			result = applyTransformations((query as any).TRANSFORMATIONS, result);
		}
		result = applyOptions((query as any).OPTIONS, result);

		if (result.length > this.rowLimit) {
			throw new ResultTooLargeError("performQuery: Result length > 5000 rows");
		}

		return result;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		return readDatasetInfo();
	}
}
