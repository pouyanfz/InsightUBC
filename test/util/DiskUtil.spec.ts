import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { clearDisk, getContentFromArchives } from "../TestUtil";
import { InsightDatasetKind, InsightError } from "../../src/controller/IInsightFacade";
import { parseDataset } from "../../src/model/Dataset/CourseDataset/DatasetParser";
import { loadDataset, saveDataset } from "../../src/util/DiskUtil";
import InsightFacade from "../../src/controller/InsightFacade";
import { idExists } from "../../src/util/DiskUtil";

import fs from "fs-extra";

use(chaiAsPromised);

const DATA_DIR = "./data";

describe("diskUtil", function () {
	describe("saveDataset", function () {
		beforeEach(async function () {
			await clearDisk();
		});

		it("should write a json file given a valid Dataset", async function () {
			const content = await getContentFromArchives("singleSection.zip");
			const dataset = await parseDataset("sections", content, InsightDatasetKind.Sections);

			await saveDataset(dataset);
			const result = JSON.parse(await fs.readFile(`${DATA_DIR}/sections.json`, "utf8"));
			const answer = {
				id: "sections",
				kind: "sections",
				rows: [
					{
						sections_dept: "cpsc",
						sections_id: "310",
						sections_instructor: "",
						sections_title: "intr sftwr eng",
						sections_uuid: "90541",
						sections_year: 1900,
						sections_avg: 75.14,
						sections_pass: 166,
						sections_fail: 4,
						sections_audit: 0,
					},
				],
			};
			expect(result).to.deep.equal(answer);
		});

		it("should write a json file with multiple sections", async function () {
			const content = await getContentFromArchives("threeCourses.zip");
			const dataset = await parseDataset("threeCourses", content, InsightDatasetKind.Sections);

			await saveDataset(dataset);
			const result = JSON.parse(await fs.readFile(`${DATA_DIR}/threeCourses.json`, "utf8"));

			const answer = {
				id: "threeCourses",
				kind: "sections",
				rows: [
					{
						threeCourses_dept: "cpsc",
						threeCourses_id: "410",
						threeCourses_instructor: "baniassad, elisa",
						threeCourses_title: "adv software eng",
						threeCourses_uuid: "1327",
						threeCourses_year: 2014,
						threeCourses_avg: 79.39,
						threeCourses_pass: 135,
						threeCourses_fail: 0,
						threeCourses_audit: 0,
					},
					{
						threeCourses_dept: "cpsc",
						threeCourses_id: "410",
						threeCourses_instructor: "",
						threeCourses_title: "adv software eng",
						threeCourses_uuid: "90575",
						threeCourses_year: 1900,
						threeCourses_avg: 75.28,
						threeCourses_pass: 77,
						threeCourses_fail: 2,
						threeCourses_audit: 0,
					},
					{
						threeCourses_dept: "cpsc",
						threeCourses_id: "310",
						threeCourses_instructor: "palyart-lamarche, marc",
						threeCourses_title: "intr sftwr eng",
						threeCourses_uuid: "1293",
						threeCourses_year: 2014,
						threeCourses_avg: 78.69,
						threeCourses_pass: 156,
						threeCourses_fail: 0,
						threeCourses_audit: 0,
					},
					{
						threeCourses_dept: "cpsc",
						threeCourses_id: "310",
						threeCourses_instructor: "baniassad, elisa",
						threeCourses_title: "intr sftwr eng",
						threeCourses_uuid: "1294",
						threeCourses_year: 2014,
						threeCourses_avg: 80.35,
						threeCourses_pass: 150,
						threeCourses_fail: 0,
						threeCourses_audit: 0,
					},
					{
						threeCourses_dept: "cpsc",
						threeCourses_id: "210",
						threeCourses_instructor: "baniassad, elisa",
						threeCourses_title: "sftwr constructn",
						threeCourses_uuid: "1265",
						threeCourses_year: 2014,
						threeCourses_avg: 73.27,
						threeCourses_pass: 127,
						threeCourses_fail: 15,
						threeCourses_audit: 0,
					},
					{
						threeCourses_dept: "cpsc",
						threeCourses_id: "210",
						threeCourses_instructor: "",
						threeCourses_title: "sftwr constructn",
						threeCourses_uuid: "83408",
						threeCourses_year: 1900,
						threeCourses_avg: 71.05,
						threeCourses_pass: 353,
						threeCourses_fail: 48,
						threeCourses_audit: 0,
					},
				],
			};
			expect(result).to.deep.equal(answer);
		});
	});

	describe("loadDataset", function () {
		beforeEach(async function () {
			await clearDisk();
		});

		it("should load a valid .json file given the correct id", async function () {
			const content = await getContentFromArchives("threeCourses.zip");
			const dataset = await parseDataset("threeCourses", content, InsightDatasetKind.Sections);

			await saveDataset(dataset);

			const result = await loadDataset("threeCourses");
			if (!result) {
				expect.fail("result should not be null");
			}
			expect(result.id).to.equal(dataset.id);
			expect(result.kind).to.equal(dataset.kind);
			expect(result.rows).to.have.deep.members(dataset.rows);
		});

		it("should fail when loading a .json file with missing fields", async function () {
			const content =
				"{\n" +
				'\t"id": "threeCourses",\n' +
				'\t"kind": "sections",\n' +
				'\t"sections": [\n' +
				"\t\t{\n" +
				'\t\t\t"dept": "cpsc",\n' +
				'\t\t\t"id": "410"\n' +
				"\t\t}\n" +
				"\t]\n" +
				"}";

			await fs.outputFile(DATA_DIR + "/invalid.json", content);

			try {
				await loadDataset("invalid");
				expect.fail("should have threw error for invalid section");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// TODO: Don't need to worry about this since parseDataset and saveDataset are correct. Come back to this when we have time.
		// it("should fail when given a section with wrong type for a field", async function () {
		// 	const content =
		// 		"{\n" +
		// 		'\t"id": "sections",\n' +
		// 		'\t"kind": "sections",\n' +
		// 		'\t"sections": [\n' +
		// 		"\t\t{\n" +
		// 		'\t\t\t"dept": 10,\n' +
		// 		'\t\t\t"id": 310,\n' +
		// 		'\t\t\t"instructor": 100,\n' +
		// 		'\t\t\t"title": 9000,\n' +
		// 		'\t\t\t"uuid": 1500,\n' +
		// 		'\t\t\t"year": "1900",\n' +
		// 		'\t\t\t"avg": "75.14",\n' +
		// 		'\t\t\t"pass": "166",\n' +
		// 		'\t\t\t"fail": "4",\n' +
		// 		'\t\t\t"audit": "0"\n' +
		// 		"\t\t}\n" +
		// 		"\t]\n" +
		// 		"}";
		// 	await fs.outputFile(DATA_DIR + "/invalid.json", content);

		// 	try {
		// 		loadDataset("invalid");
		// 		expect.fail("should have threw error for invalid section");
		// 	} catch (err) {
		// 		expect(err).to.be.instanceOf(InsightError);
		// 	}
		// });
	});
});

describe("idExists", async function () {
	let facade: InsightFacade;
	let smallSection: string;

	beforeEach(async function () {
		await clearDisk();
		facade = new InsightFacade();
		smallSection = await getContentFromArchives("validSmall.zip");
	});

	it("should return true if the file exists", async function () {
		await facade.addDataset("sections", smallSection, InsightDatasetKind.Sections);
		await facade.addDataset("pair", smallSection, InsightDatasetKind.Sections);
		await facade.addDataset("dataset", smallSection, InsightDatasetKind.Sections);
		const result = await idExists("sections");
		expect(result).to.equal(true);
	});

	it("should return false if the file does not exist", async function () {
		await facade.addDataset("sections", smallSection, InsightDatasetKind.Sections);
		const result = await idExists("missing");
		expect(result).to.equal(false);
	});
});
