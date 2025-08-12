/**
 * DiskUtil.ts
 * -----------
 * Manages disk persistence for datasets and their metadata.
 *
 * Responsibilities:
 * - Save dataset objects as JSON files
 * - Load dataset objects from disk
 * - Update and maintain metadata file (_listOfDatasets.json)
 * - Delete dataset files and update metadata
 * - Provide utilities for checking dataset existence and listing IDs
 *
 * Used by: InsightFacade.ts
 */

import IDataset from "../model/Dataset/IDataset";
import fs from "fs-extra";
import { InsightDataset, InsightError } from "../controller/IInsightFacade";
import SectionsDataset from "../model/Dataset/CourseDataset/SectionsDataset";
import RoomsDataset from "../model//Dataset/RoomDataset/RoomsDataset";

const DATA_DIR = "data";
const FILE_EXTENSION = ".json";
const METADATA_FILE = `${DATA_DIR}/_listOfDatasets${FILE_EXTENSION}`;

export async function saveDataset(dataset: IDataset): Promise<void> {
	try {
		const filePath = `${DATA_DIR}/${dataset.id}${FILE_EXTENSION}`;
		await fs.outputFile(filePath, JSON.stringify(dataset.toDiskFormat(), null, 2));
		let metadata: InsightDataset[] = [];
		try {
			metadata = await fs.readJson(METADATA_FILE);
		} catch {
			metadata = [];
		}

		metadata = metadata.filter((d) => d.id !== dataset.id);
		metadata.push({
			id: dataset.id,
			kind: dataset.kind,
			numRows: dataset.numRows,
		});

		await fs.outputFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
		// console.log("✅ listOfDatasets.json after saving:", JSON.stringify(metadata, null, 2));
	} catch {
		throw new InsightError("saveDataset: unable to write file");
	}
}
export async function loadDataset(id: string): Promise<IDataset | null> {
	try {
		const file = await fs.readFile(`${DATA_DIR}/${id}${FILE_EXTENSION}`, "utf-8");
		const object = JSON.parse(file);

		if (!("id" in object) || !("kind" in object) || !("rows" in object)) {
			throw new InsightError("loadDataset: json file is missing fields");
		}

		if (object.kind === "sections") {
			return new SectionsDataset(object.id, object.kind, object.rows);
		} else if (object.kind === "rooms") {
			return new RoomsDataset(object.id, object.kind, object.rows);
		} else {
			throw new InsightError("loadDataset: unknown dataset kind");
		}
	} catch {
		throw new InsightError("loadDataset: couldn't read or parse file");
	}
}

export async function readDatasetInfo(): Promise<InsightDataset[]> {
	try {
		return await fs.readJson(METADATA_FILE);
	} catch {
		return [];
	}
}

export async function deleteDatasetFile(id: string): Promise<void> {
	try {
		await fs.remove(`${DATA_DIR}/${id}${FILE_EXTENSION}`);
		let metadata = await readDatasetInfo();
		metadata = metadata.filter((d) => d.id !== id);
		await fs.outputFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
		// console.log("🗑️ listOfDatasets.json after deletion:", JSON.stringify(metadata, null, 2));
	} catch {
		throw new InsightError("File not found");
	}
}

export async function readIds(): Promise<string[]> {
	const info = await readDatasetInfo();
	return info.map((d) => d.id);
}

export async function idExists(id: string): Promise<boolean> {
	const ids = await readIds();
	return ids.includes(id);
}
