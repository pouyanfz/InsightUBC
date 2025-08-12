/**
 * DatasetParser.ts
 * ----------------
 * Parses a base64-encoded ZIP file and returns a structured Dataset object.
 *
 * Responsibilities:
 * - Decode and unzip the base64 string
 * - Locate and extract all JSON files from the 'courses/' folder
 * - Validate and parse each section using Section.parse()
 * - Construct and return a SectionsDataset or RoomDataset
 * - Throw InsightError if the ZIP is invalid or contains no valid data
 *
 * Used by: InsightFacade.ts, DiskUtil.ts
 */

import JSZip from "jszip";
import IDataset from "../IDataset";
import { InsightDatasetKind, InsightError, InsightResult } from "../../../controller/IInsightFacade";
import SectionsDataset from "./SectionsDataset";
import RoomDatasetParser from "../RoomDataset/RoomDatasetParser";

const mfields: Record<string, string> = {
	avg: "Avg",
	pass: "Pass",
	fail: "Fail",
	audit: "Audit",
	year: "Year",
};
const sfields: Record<string, string> = {
	dept: "Subject",
	id: "Course",
	instructor: "Professor",
	title: "Title",
	uuid: "id",
};
const SECTION_OVERALL_YEAR = 1900;
const requiredFields = Object.values(mfields).concat(Object.values(sfields));

export async function parseDataset(id: string, content: string, kind: InsightDatasetKind): Promise<IDataset> {
	if (kind === InsightDatasetKind.Sections) {
		const files = await getCourseFiles(content);
		const fileContents = await Promise.all(files.map(readFileAsString));
		const sections = extractValidSections(id, fileContents);

		if (sections.length === 0) {
			throw new InsightError("No valid sections found");
		}
		return new SectionsDataset(id, kind, sections);

	} else if (kind === InsightDatasetKind.Rooms) {
		const roomsDataset = await RoomDatasetParser.parse(content, id);
		if (roomsDataset.getRooms().length === 0) {
			throw new InsightError("No valid rooms found");
		}
		return roomsDataset;

	} else {
		throw new InsightError("Unsupported dataset kind");
	}
}

async function getCourseFiles(content: string): Promise<JSZip.JSZipObject[]> {
	let zipped;
	try {
		zipped = await JSZip.loadAsync(content, { base64: true });
	} catch {
		throw new InsightError("Invalid ZIP content");
	}

	// This part of implementation was developed with the help of an AI assistant (ChatGPT).
	const files = Object.values(zipped.files).filter(function (file) {
		return file.name.startsWith("courses/") && !file.dir;
	});

	if (files.length === 0) {
		throw new InsightError("Missing or empty 'courses/' folder");
	}
	return files;
}

async function readFileAsString(file: JSZip.JSZipObject): Promise<string> {
	return file.async("string");
}

function createSection(id: string, section: any): InsightResult | null {
	if (!section || typeof section !== "object") {
		return null;
	}

	for (const field of requiredFields) {
		if (!(field in section)) {
			return null;
		}
	}

	try {
		const item: InsightResult = {};
		for (const mfield of Object.keys(mfields)) {
			const jsonKey = mfields[mfield];
			const value = Number(section[jsonKey]);
			if (isNaN(value)) {
				return null;
			}
			if (mfield === "year" && section.Section === "overall") {
				item[id + "_" + mfield] = SECTION_OVERALL_YEAR;
			} else {
				item[id + "_" + mfield] = Number(section[jsonKey]);
			}
		}
		for (const sfield of Object.keys(sfields)) {
			const jsonKey = sfields[sfield];
			item[id + "_" + sfield] = String(section[jsonKey]).trim();
		}
		return item;
	} catch {
		return null;
	}
}

function extractValidSections(id: string, contents: string[]): InsightResult[] {
	const sections: InsightResult[] = [];
	for (const raw of contents) {
		try {
			const json = JSON.parse(raw);
			if (Array.isArray(json.result)) {
				for (const entry of json.result) {
					const section = createSection(id, entry);
					if (section) {
						sections.push(section);
					}
				}
			}
		} catch {
			continue;
		}
	}
	return sections;
}
