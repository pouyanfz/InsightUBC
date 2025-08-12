import { expect } from "chai";
import { parseDataset } from "../../src/model/Dataset/CourseDataset/DatasetParser";
import { getContentFromArchives } from "../TestUtil";
import { InsightDatasetKind, InsightError } from "../../src/controller/IInsightFacade";

describe("parseDataset()", function () {
	it("should parse valid base64 dataset and return Dataset", async function () {
		const content = await getContentFromArchives("singleSection.zip");
		const dataset = await parseDataset("sections", content, InsightDatasetKind.Sections);

		expect(dataset.id).to.equal("sections");
		expect(dataset.kind).to.equal("sections");
		expect(dataset.numRows).to.equal(1);

		const section = dataset.rows[0];

		expect(section).to.deep.equal({
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
		});
	});

	it("should throw InsightError if 'courses/' folder is missing", async function () {
		const content = await getContentFromArchives("invalidPath.zip");

		try {
			await parseDataset("bad", content, InsightDatasetKind.Sections);
			expect.fail("Should have thrown InsightError");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});

	it("should throw InsightError if no valid sections are found", async function () {
		const content = await getContentFromArchives("emptySection.zip");

		try {
			await parseDataset("empty", content, InsightDatasetKind.Sections);
			expect.fail("Should have thrown InsightError");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});

	it("should skip invalid files and still return valid sections", async function () {
		const content = await getContentFromArchives("validAndInvalidSections.zip");
		const dataset = await parseDataset("mixed", content, InsightDatasetKind.Sections);

		expect(dataset.numRows).to.equal(2);
		const results = dataset.rows;
		expect(results).to.deep.include({
			mixed_dept: "cpsc",
			mixed_id: "310",
			mixed_instructor: "palyart-lamarche, marc",
			mixed_title: "intr sftwr eng",
			mixed_uuid: "1293",
			mixed_year: 2014,
			mixed_avg: 78.69,
			mixed_pass: 156,
			mixed_fail: 0,
			mixed_audit: 0,
		});
	});

	it("should throw InsightError for invalid base64 content", async function () {
		try {
			await parseDataset("invalid", "not-a-valid-base64-string", InsightDatasetKind.Sections);
			expect.fail("Should have thrown InsightError");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});

	it("should throw InsightError for zip with no files", async function () {
		const content = await getContentFromArchives("invalidEmptyFolder.zip");

		try {
			await parseDataset("noFiles", content, InsightDatasetKind.Sections);
			expect.fail("Should have thrown InsightError");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});

	it("should skip corrupt JSON files", async function () {
		const content = await getContentFromArchives("corruptCourse.zip");
		try {
			await parseDataset("corrupt", content, InsightDatasetKind.Sections);
			expect.fail("Should have thrown InsightError");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});

	it("should correctly parse all valid sections from multiple course files", async function () {
		const expectedTotal = 6;
		const content = await getContentFromArchives("threeCourses.zip");
		const dataset = await parseDataset("threeCourses", content, InsightDatasetKind.Sections);

		expect(dataset.numRows).to.equal(expectedTotal);
		const results = dataset.rows;
		expect(results).to.deep.include.members([
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
		]);
	});
});
