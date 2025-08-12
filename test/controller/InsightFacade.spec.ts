import {
	IInsightFacade,
	InsightDatasetKind,
	NotFoundError,
	ResultTooLargeError,
	InsightError,
	InsightResult,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let smallSection: string;
	let emptyZip: string;
	let emptySections: string;
	let bigSections: string;
	let invalidJson: string;
	let singleSection: string;
	let invalidFolderName: string;
	let invalidZip: string;
	let corruptCourse: string;
	let invalidFolderPath: string;
	let invalidSections: string;
	let noCourses: string;
	let invalidJson2: string;

	before(async function () {
		// This block runs once and loads the datasets.
		smallSection = await getContentFromArchives("validSmall.zip");
		emptyZip = await getContentFromArchives("empty.zip");
		emptySections = await getContentFromArchives("emptySection.zip");
		bigSections = await getContentFromArchives("pair.zip");
		invalidJson = await getContentFromArchives("invalidJson.zip");
		invalidJson2 = await getContentFromArchives("invalid_json.zip");
		singleSection = await getContentFromArchives("singleSection.zip");
		invalidFolderName = await getContentFromArchives("invalidFolderName.zip");
		invalidZip = await getContentFromArchives("invalidStructure.zip");
		corruptCourse = await getContentFromArchives("corruptCourse.zip");
		invalidFolderPath = await getContentFromArchives("invalidPath.zip");
		invalidSections = await getContentFromArchives("invalidSection.zip");
		noCourses = await getContentFromArchives("no_courses_directory.zip");
	});

	// ----------------------------------ADD DATASET----------------------------------
	// AddDataset tests
	describe("addDataset", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		// empty dataset id
		it("should reject adding with an empty dataset id", async function () {
			const result = facade.addDataset("", bigSections, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// underscore in dataset id
		it("should reject adding dataset id with underscore", async function () {
			const invalidId = "wrong_id";
			const result = facade.addDataset(invalidId, smallSection, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		//only underscore in dataset id
		it("should reject adding dataset id with only underscore", async function () {
			const invalidId = "_";
			const result = facade.addDataset(invalidId, smallSection, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// whitespace in dataset id
		it("should reject adding dataset id with only whitespaces", async function () {
			const invalidId = "\t\n ";
			const result = facade.addDataset(invalidId, smallSection, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// dataset id with only whitespace
		it("should reject adding dataset id with only one whitespace", async function () {
			const invalidId = " ";
			const result = facade.addDataset(invalidId, smallSection, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// dataset with mulfiple underscores
		it("should reject adding dataset id with multiple underscores", async function () {
			const invalidId = "wrong_id_id";
			const result = facade.addDataset(invalidId, smallSection, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// dataset with underscor at the end
		it("should reject adding dataset id that ends with underscore", async function () {
			const invalidId = "wrongId_";
			const result = facade.addDataset(invalidId, smallSection, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// dataset starts and ends with underscore
		it("should reject adding dataset id that starts and ends with underscore", async function () {
			const invalidId = "_wrong_id_";
			const result = facade.addDataset(invalidId, smallSection, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// dataset with invalid kind
		it("should reject adding dataset with invalid kind", async function () {
			const result = facade.addDataset("ubc", smallSection, null as any);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// dataset with empty content
		it("should reject adding dataset with empty content", async function () {
			const id = "ubc";
			const result = facade.addDataset(id, emptyZip, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// adding same dataset after another operation
		it("should reject adding the same dataset id again after another operation", async function () {
			await facade.addDataset("ubc", smallSection, InsightDatasetKind.Sections);
			await facade.listDatasets();
			const result = facade.addDataset("ubc", smallSection, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// already added dataset
		it("should reject adding dataset if it already exists", async function () {
			const id = "ubc";
			try {
				const result1 = await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				expect(result1).to.deep.equal([id]);
			} catch (err) {
				expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
			}
			try {
				const result2 = await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				expect.fail(`Expected rejection for adding existing dataset, but got: ${result2}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
			const listResult = await facade.listDatasets();
			expect(listResult).to.have.length(1);
			expect(listResult).to.deep.equal([
				{
					id: id,
					kind: InsightDatasetKind.Sections,
					numRows: 39,
				},
			]);
		});

		// invalid base64 content
		it("should rejects dataset with corrupt base64 content", async () => {
			const corruptString = "!!@@notbase64###";
			const add = facade.addDataset("badData", corruptString, InsightDatasetKind.Sections);
			await expect(add).to.eventually.be.rejectedWith(InsightError);
			const current = await facade.listDatasets();
			expect(current).to.be.an("array").that.is.empty;
		});

		// invalid zipfile
		it("should reject adding dataset with invalid zipfile content", async function () {
			const id = "ubc";
			const result = facade.addDataset(id, "abcd", InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// invalid folder name
		it("should reject adding dataset with invalid folder name content", async function () {
			const id = "ubc";
			const result = facade.addDataset(id, invalidFolderName, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// invalid json format
		it("should reject adding dataset with invalid json format content", async function () {
			const id = "ubc";
			const result = facade.addDataset(id, invalidJson, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// invalid zipfile structure
		it("should reject adding dataset with invalid zipfile structure content", async function () {
			const id = "ubc";

			const result = facade.addDataset(id, invalidZip, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// corrupt course
		it("should reject adding dataset with corrupt course content", async function () {
			const id = "ubc";
			const result = facade.addDataset(id, corruptCourse, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// invalid empty folder
		it("should reject adding dataset with invalid empty folder content", async function () {
			const id = "ubc";
			const result = facade.addDataset(id, invalidFolderName, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// invalid folder path
		it("should reject adding dataset with invalid folder path content", async function () {
			const id = "ubc";
			const result = facade.addDataset(id, invalidFolderPath, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// empty sections dataset
		it("should reject adding dataset with empty sections  content", async function () {
			const id = "ubc";
			const result = facade.addDataset(id, emptySections, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		//invalud content
		it("should reject adding dataset with invalid content", async function () {
			const id = "ubc";
			const invalidContent = "";
			const result = facade.addDataset(id, invalidContent, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// invalid section dataset with no sections
		it("should reject adding invalid sections dataset with no sections content", async function () {
			const id = "ubc";
			const result = facade.addDataset(id, invalidSections, InsightDatasetKind.Sections);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// valid smiple dataset id
		it("should pass adding with valid dataset id", async function () {
			const id = "ubc";
			try {
				const result = await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				expect(result).to.deep.equal([id]);
				const listResult = await facade.listDatasets();
				expect(listResult).to.have.length(1);
				expect(listResult).to.deep.equal([
					{
						id: id,
						kind: InsightDatasetKind.Sections,
						numRows: 39,
					},
				]);
			} catch (err) {
				expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
			}
		});

		// valid add to big dataset
		it("should pass adding with valid dataset id to a big dataset", async function () {
			const id = "ubcBig";
			try {
				const result = await facade.addDataset(id, bigSections, InsightDatasetKind.Sections);
				expect(result).to.deep.equal([id]);
				const listResult = await facade.listDatasets();
				expect(listResult).to.have.length(1);
				expect(listResult).to.deep.equal([
					{
						id: id,
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					},
				]);
			} catch (err) {
				expect.fail(`Expected successful addition of big dataset, but got error: ${err}`);
			}
		});

		// valid special characters in dataset id
		it("should pass adding with valid dataset id with special characters", async function () {
			const id = "ubc!@#$%^&*() 123 -=+ ?[]{}";
			const result = await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
			return expect(result).to.deep.equal([id]);
		});

		// valid dataset id with only one character
		it("should pass adding with valid dataset id with only one character", async function () {
			const id = "a";
			try {
				const result = await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				expect(result).to.deep.equal([id]);
			} catch (err) {
				expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
			}
		});

		// valid dataset id with Uppercase and lowercase
		it("should pass adding with valid dataset id with different case", async function () {
			const id = "ubcID";
			const result = await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
			expect(result).to.deep.equal([id]);
			expect(result).to.have.length(1);
			const datasets = await facade.listDatasets();
			expect(datasets).to.have.length(1);
			expect(datasets).to.have.deep.equal([
				{
					id: id,
					kind: InsightDatasetKind.Sections,
					numRows: 39,
				},
			]);
		});

		// valid add remove and add again
		it("should pass adding with valid dataset id after removing it", async function () {
			const id = "ubc";
			try {
				await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				await facade.removeDataset(id);
				const result = await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				expect(result).to.deep.equal([id]);
				expect(result).to.have.length(1);
			} catch (err) {
				expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
			}
		});

		// valid similar dataset ids
		it("should pass adding with valid similar dataset ids", async function () {
			const firstId = "ubc";
			const secondId = "ubc2";
			try {
				const firstAdd = await facade.addDataset(firstId, smallSection, InsightDatasetKind.Sections);
				expect(firstAdd).to.have.length(1);
			} catch (err) {
				expect.fail(`Expected successful addition of first dataset, but got error: ${err}`);
			}
			try {
				const secondAdd = await facade.addDataset(secondId, smallSection, InsightDatasetKind.Sections);
				expect(secondAdd).to.have.length(2);
				expect(secondAdd).to.have.deep.equal([firstId, secondId]);
				const datasets = await facade.listDatasets();
				expect(datasets).to.have.length(2);
				expect(datasets).to.have.deep.equal([
					{
						id: firstId,
						kind: InsightDatasetKind.Sections,
						numRows: 39,
					},
					{
						id: secondId,
						kind: InsightDatasetKind.Sections,
						numRows: 39,
					},
				]);
			} catch (err) {
				expect.fail(`Expected successful addition of second dataset, but got error: ${err}`);
			}
		});

		// valid three different dataset ids
		it("should pass adding with valid three different dataset ids", async function () {
			const id1 = "ubc2";
			const id2 = "ubc2 ";
			const id3 = "ubc 2";
			try {
				const result1 = await facade.addDataset(id1, smallSection, InsightDatasetKind.Sections);
				expect(result1).to.deep.equal([id1]);
				const result2 = await facade.addDataset(id2, smallSection, InsightDatasetKind.Sections);
				expect(result2).to.have.deep.members([id1, id2]);
				const result3 = await facade.addDataset(id3, smallSection, InsightDatasetKind.Sections);
				expect(result3).to.have.deep.members([id1, id2, id3]);
				const datasets = await facade.listDatasets();
				const length = 3;
				expect(datasets).to.have.length(length);
				expect(datasets).to.have.deep.equal([
					{
						id: id1,
						kind: InsightDatasetKind.Sections,
						numRows: 39,
					},
					{
						id: id2,
						kind: InsightDatasetKind.Sections,
						numRows: 39,
					},
					{
						id: id3,
						kind: InsightDatasetKind.Sections,
						numRows: 39,
					},
				]);
			} catch (err) {
				expect.fail(`Expected successful addition of three datasets, but got error: ${err}`);
			}
		});

		// valid dataset with single section
		it("should pass adding with valid dataset id with single section", async function () {
			const id = "ubcSingle";
			try {
				const result = await facade.addDataset(id, singleSection, InsightDatasetKind.Sections);
				expect(result).to.deep.equal([id]);
				const datasets = await facade.listDatasets();
				expect(datasets).to.have.length(1);
				expect(datasets).to.have.deep.equal([
					{
						id: id,
						kind: InsightDatasetKind.Sections,
						numRows: 1,
					},
				]);
			} catch (err) {
				expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
			}
		});

		// keep the valid dataset after adding an invalid dataset
		it("should pass keep the valid dataset after adding an invalid dataset", async function () {
			const id1 = "ubc";
			const id2 = "invalid";
			try {
				await facade.addDataset(id1, smallSection, InsightDatasetKind.Sections);
				await facade.addDataset(id2, emptyZip, InsightDatasetKind.Sections);
				expect.fail("Expected InsightError due to invalid dataset");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
			const datasets = await facade.listDatasets();
			expect(datasets).to.have.length(1);
			expect(datasets).to.have.deep.equal([
				{
					id: id1,
					kind: InsightDatasetKind.Sections,
					numRows: 39,
				},
			]);
		});

		// valid uppercase and lowercase duplicate dataset id
		it("should pass adding dataset if it already exists with different case", async function () {
			const id1 = "ubc";
			const id2 = "uBc";
			try {
				await facade.addDataset(id1, smallSection, InsightDatasetKind.Sections);
			} catch (err) {
				expect.fail(`Expected successful addition of datasets, but got error: ${err}`);
			}
			try {
				const result = await facade.addDataset(id2, smallSection, InsightDatasetKind.Sections);
				expect(result).to.contain(id1);
				expect(result).to.contain(id2);
				expect(result).to.have.length(2);
			} catch (err) {
				expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
			}
		});

		// Tyler's extra tests:
		it("should reject a content where there is no courses directory", async function () {
			try {
				await facade.addDataset("dataset", noCourses, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject a content non-JSON formatted courses", async function () {
			try {
				await facade.addDataset("dataset", invalidJson2, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});

	// ----------------------------------REMOVE DATASET----------------------------------
	// removeDataset tests
	describe("removeDataset", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		// remove empty dataset id
		it("should reject removing with an empty dataset id", async function () {
			const id = "";
			const result = facade.removeDataset(id);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// remove invalid dataset id
		it("should reject removing with an invalid dataset id", async function () {
			const invalidId = "invalid_id";
			const result = facade.removeDataset(invalidId);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		// remove invalid dataset with only whitespace
		it("should reject removing a dataset id with only whitespace", async function () {
			const invalidId = " ";
			try {
				await facade.addDataset(invalidId, smallSection, InsightDatasetKind.Sections);
				await facade.removeDataset(invalidId);
				expect.fail("Expected InsightError due to id with only whitespace");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// remove dataset that doesn't exist
		it("should reject removing with a dataset id that doesn't exist", async function () {
			const invalidId = "nonExistedId";
			const validId = "ubc";
			try {
				await facade.addDataset(validId, smallSection, InsightDatasetKind.Sections);
				await facade.removeDataset(invalidId);
				expect.fail("Expected InsightError due to id with removing an id that doesnt exist");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		// remove and add dataset with the same id multiple times
		it("should pass with the same dataset id added and removed multiple times", async function () {
			const id = "ubc";
			try {
				await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				await facade.removeDataset(id);
				const result = await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				expect(result).to.deep.equal([id]);
			} catch (err) {
				expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
			}
		});

		// remove dataset that exists
		it("should pass removing a valid dataset id", async function () {
			const id = "ubc";
			try {
				await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				const result = await facade.removeDataset(id);
				expect(result).to.equal(id);
			} catch (err) {
				expect.fail(`Expected successful removal of dataset, but got error: ${err}`);
			}
		});

		// remove dataset should be case sensitive
		it("should pass removing a dataset id with different case", async function () {
			const id1 = "ubc";
			const id2 = "UBC";
			try {
				await facade.addDataset(id1, smallSection, InsightDatasetKind.Sections);
				await facade.removeDataset(id2);
				expect.fail("Expected InsightError due to case-sensitive dataset id");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		// remove dataset that exists and then remove it again
		it("should reject removing a dataset id that has already been removed", async function () {
			const id = "ubc";
			try {
				await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				await facade.removeDataset(id);
				await facade.removeDataset(id);
				expect.fail("Expected InsightError due to already removed dataset id");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		// remove two datasets with valid ids
		it("should pass with removing valid dataset ids", async function () {
			const id1 = "ubc";
			const id2 = "ubc2";
			try {
				await facade.addDataset(id1, smallSection, InsightDatasetKind.Sections);
				await facade.addDataset(id2, smallSection, InsightDatasetKind.Sections);
				const result1 = await facade.removeDataset(id1);
				const result2 = await facade.removeDataset(id2);
				expect(result1).to.include(id1);
				expect(result2).to.equal(id2);
			} catch (err) {
				expect.fail(`Expected successful removal of datasets, but got error: ${err}`);
			}
		});

		// Tyles's extra tests
		it("should remove the correct dataset when there are several datasets", async function () {
			try {
				await facade.addDataset("sections", smallSection, InsightDatasetKind.Sections);
				await facade.addDataset("removethis", bigSections, InsightDatasetKind.Sections);
				const id = await facade.removeDataset("removethis");
				expect(id).to.eq("removethis");

				const actual = await facade.listDatasets();
				// const expected: InsightDataset[] = [{ id: "sections", kind: InsightDatasetKind.Sections, numRows: 1 }];
				const expected = [
					{
						id: "sections",
						kind: InsightDatasetKind.Sections,
						numRows: 39,
					},
				];
				expect(actual).to.deep.equal(expected);
			} catch (err) {
				expect.fail("Should have passed but instead got: " + err);
			}
		});

		it("removeDataset: should reject an id that is only whitespace", async function () {
			try {
				await facade.removeDataset(" \t\n");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});

	// ----------------------------------LIST DATASET----------------------------------
	describe("listDatasets", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		// list datasets when none are added
		it("should return an empty array when no datasets are added", async function () {
			const result = await facade.listDatasets();
			expect(result).to.deep.equal([]);
		});

		// list datasets when one is added
		it("should return an array with one dataset when one is added", async function () {
			const id = "ubc";
			try {
				await facade.addDataset(id, smallSection, InsightDatasetKind.Sections);
				const result = await facade.listDatasets();
				expect(result).to.have.length(1);
				expect(result).to.be.deep.equal([
					{
						id: id,
						kind: InsightDatasetKind.Sections,
						numRows: 39,
					},
				]);
			} catch (err) {
				expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
			}
		});

		// list datasets when multiple are added
		it("should return an array with multiple datasets when multiple are added", async function () {
			const id1 = "ubc";
			const id2 = "ubc2";
			try {
				await facade.addDataset(id1, smallSection, InsightDatasetKind.Sections);
				await facade.addDataset(id2, smallSection, InsightDatasetKind.Sections);
				const result = await facade.listDatasets();
				expect(result).to.have.length(2);
				expect(result).to.have.deep.equal([
					{ id: id1, kind: InsightDatasetKind.Sections, numRows: 39 },
					{ id: id2, kind: InsightDatasetKind.Sections, numRows: 39 },
				]);
			} catch (err) {
				expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
			}
		});

		// list datasets when some are removed
		it("should return an array with remaining datasets when some are removed", async function () {
			const id1 = "ubc";
			const id2 = "ubc2";
			try {
				await facade.addDataset(id1, smallSection, InsightDatasetKind.Sections);
				await facade.addDataset(id2, smallSection, InsightDatasetKind.Sections);
				await facade.removeDataset(id1);
				const result = await facade.listDatasets();
				expect(result).to.have.length(1);
				expect(result[0].id).to.equal(id2);
			} catch (err) {
				expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
			}
		});

		// list datasets when all are removed
		it("should return an empty array when all datasets are removed", async function () {
			const id1 = "ubc";
			const id2 = "ubc2";
			try {
				await facade.addDataset(id1, smallSection, InsightDatasetKind.Sections);
				await facade.addDataset(id2, smallSection, InsightDatasetKind.Sections);
				await facade.removeDataset(id1);
				await facade.removeDataset(id2);
				const result = await facade.listDatasets();
				expect(result).to.deep.equal([]);
			} catch (err) {
				expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
			}
		});
		// list datasets when some are added and some are removed
		it("should return an array with remaining datasets when some are added and some are removed", async function () {
			const id1 = "ubc";
			const id2 = "ubc2";
			try {
				await facade.addDataset(id1, smallSection, InsightDatasetKind.Sections);
				await facade.addDataset(id2, smallSection, InsightDatasetKind.Sections);
				await facade.removeDataset(id1);
				const result = await facade.listDatasets();
				expect(result).to.have.length(1);
				expect(result[0].id).to.equal(id2);
			} catch (err) {
				expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
			}
		});

		// list datasets when some 2nd dataset is removed
		it("should return an array with remaining datasets when some 2nd dataset is removed", async function () {
			const id1 = "ubc";
			const id2 = "ubc2";
			try {
				await facade.addDataset(id1, smallSection, InsightDatasetKind.Sections);
				await facade.addDataset(id2, smallSection, InsightDatasetKind.Sections);
				await facade.removeDataset(id2);
				const result = await facade.listDatasets();
				expect(result).to.have.length(1);
				expect(result[0].id).to.equal(id1);
			} catch (err) {
				expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
			}
		});
	});

	// ----------------------------------PERFORM QUERY----------------------------------
	// PerformQuery before adding datasets
	describe("PerformQuery with an empty dataset", function () {
		before(function () {
			facade = new InsightFacade();
		});
		after(async function () {
			await clearDisk();
		});
		const input: any = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};
		it("should reject performQuery before adding datasets", async function () {
			const result = facade.performQuery(input);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[] = []; // dummy value before being reassigned

			try {
				result = await facade.performQuery(input);
				if (errorExpected) {
					expect.fail("performQuery should have rejected but resolved instead.");
				}
				expect(result).to.have.deep.members(expected);
				expect(result).to.have.length(expected.length);
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}

				// fail case: check correct error type
				if (expected === "InsightError") {
					expect(err).to.be.instanceOf(InsightError);
				} else if (expected === "ResultTooLargeError") {
					expect(err).to.be.instanceOf(ResultTooLargeError);
				} else {
					expect.fail(`Unknown expected error: ${expected}`);
				}
			}
		}

		before(async function () {
			facade = new InsightFacade();

			const sectionsAll = await getContentFromArchives("pair.zip");
			const single = await getContentFromArchives("singleSection.zip");
			const campus = await getContentFromArchives("campus.zip");

			await facade.addDataset("sections", sectionsAll, InsightDatasetKind.Sections);
			await facade.addDataset("single", single, InsightDatasetKind.Sections);
			await facade.addDataset("rooms", campus, InsightDatasetKind.Rooms);
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		// -----------------------------------valid queries-----------------------------------

		describe("PerformQuery - Courses", function () {
			it("[Courses/valid/matchExactly.json] valid match exactly", checkQuery);
			it("[Courses/valid/startsWith.json] valid wildcard at te begining", checkQuery);
			it("[Courses/valid/endsWith.json] valid wildcard at the end", checkQuery);
			it("[Courses/valid/contains.json] valid wildcard contains ps", checkQuery);
			it("[Courses/valid/noResult.json] valid no result", checkQuery);

			// Comparison operators
			it("[Courses/valid/largerThan.json] valid greater than", checkQuery);
			it("[Courses/valid/lessThan.json] valid less than", checkQuery);
			it("[Courses/valid/lessThanEqual.json] valid less than or equal", checkQuery);
			it("[Courses/valid/greaterThanEqual.json] valid greater than or equal", checkQuery);
			it("[Courses/valid/equal.json] valid equal", checkQuery);
			it("[Courses/valid/overlappingComparison.json] valid overlapping comparison", checkQuery);
			it("[Courses/valid/overlappingComparison2.json] valid overlapping comparison", checkQuery);

			// Logical combinations
			it("[Courses/valid/and.json] valid AND combination", checkQuery);
			it("[Courses/valid/or.json] valid OR combination", checkQuery);
			it("[Courses/valid/not.json] valid NOT", checkQuery);
			it("[Courses/valid/nestedLogic.json] valid nested AND/OR/NOT", checkQuery);
			it("[Courses/valid/andNot.json] valid AND/NOT", checkQuery);
			it("[Courses/valid/orNot.json] valid OR/NOT", checkQuery);
			it("[Courses/valid/andOrNot.json] valid AND/OR/NOT", checkQuery);
			it("[Courses/valid/is.json] valid IS", checkQuery);
			it("[Courses/valid/singleOr.json] valid single OR", checkQuery);
			it("[Courses/valid/singleAnd.json] valid single AND", checkQuery);
			it("[Courses/valid/wildcardAnd.json] valid wildcard/AND", checkQuery);
			it("[Courses/valid/wildcardOr.json] valid wildcard/OR", checkQuery);
			it("[Courses/valid/doubleWildcard.json] valid double wildcard", checkQuery);

			// Valid all columns
			it("[Courses/valid/allColumns.json] valid all columns", checkQuery);

			// Valid ORDER cases
			it("[Courses/valid/orderByString.json] valid ORDER by string field", checkQuery);
			it("[Courses/valid/orderByNumber.json] valid ORDER by numeric field", checkQuery);
			it("[Courses/valid/orderDirKeys.json] valid ORDER DOWN by number and string fields", checkQuery);
			it("[Courses/valid/orderDirKeys2.json] valid ORDER UP by numeric and string fields", checkQuery);

			// Valid TRANSFORMATIONS cases
			it("[Courses/valid/emptyApply.json] valid query with an empty apply list", checkQuery);
			it("[Courses/valid/transformationAvg.json] valid query with AVG", checkQuery);
			it("[Courses/valid/transformationCountNumeric.json] valid query with numeric COUNT", checkQuery);
			it("[Courses/valid/transformationCountString.json] valid query with string COUNT", checkQuery);
			it("[Courses/valid/transformationManyApply.json] valid query with more than 1 apply rule", checkQuery);
			it("[Courses/valid/transformationMax.json] valid query with MAX", checkQuery);
			it("[Courses/valid/transformationMin.json] valid query with MIN", checkQuery);
			it("[Courses/valid/transformationSum.json] valid query with SUM", checkQuery);

			// 5000 limit
			it("[Courses/valid/limit5000.json] valid query with limit 5000", checkQuery);
			it("[Courses/valid/limit4999.json] valid query with limit 4999", checkQuery);

			// Complex queries
			it("[Courses/valid/complexQuery.json] valid complex query", checkQuery);
			it("[Courses/valid/complexQuery2.json] valid complex query", checkQuery);
			it("[Courses/valid/allParameters.json] valid query with all parameters", checkQuery);
			it("[Courses/valid/caseSensitiveScomp.json] valid case sensitive query", checkQuery);
			it("[Courses/valid/duplicateColumn.json] valid query with duplicate columns", checkQuery);
			it("[Courses/valid/whereAtTheEnd.json] valid query with WHERE at the end", checkQuery);
			it("[Courses/valid/emptyWildcard.json] valid empty wildcard", checkQuery);
			it("[Courses/valid/deeplyNested.json] valid deeply nested query", checkQuery);

			// Different id
			it("[Courses/valid/differentId.json] valid query but different id from the others", checkQuery);

			// -----------------------------------invalid queries-----------------------------------
			it("[Courses/invalid/emptyWhere.json] invalid empty WHERE", checkQuery);
			it("[Courses/invalid/invalid.json] invalid Query missing WHERE", checkQuery);
			it("[Courses/invalid/tooBigResult.json] invalid Too big result", checkQuery);
			it("[Courses/invalid/limit5001.json] invalid query with limit 5001", checkQuery);
			it("[Courses/invalid/orderByInvalid.json] invalid ORDER by invalid field", checkQuery);
			it("[Courses/invalid/missingColumn.json] empty column in SELECT", checkQuery);
			it("[Courses/invalid/invalidColumn.json] invalid column in SELECT", checkQuery);
			it("[Courses/invalid/invalidKey.json] invalid column key", checkQuery);
			it("[Courses/invalid/mcomparisonString.json] numeric comparator with string", checkQuery);
			it("[Courses/invalid/scomparisonNumber.json] string comparator with numeric", checkQuery);
			it("[Courses/invalid/invalidID.json] invalid id with underscore", checkQuery);
			it("[Courses/invalid/invalidIdNoCharacter.json] invalid id with no characters", checkQuery);
			it("[Courses/invalid/extraTopKey.json] invalid with extra top level key", checkQuery);
			it("[Courses/invalid/extraInOptions.json] invalid OPTIONS with extra property", checkQuery);
			it("[Courses/invalid/multiKey.json] invalid ", checkQuery);
			it("[Courses/invalid/whiteSpaceId.json] invalid dataset id with whiespace ID", checkQuery);
			it("[Courses/invalid/invalidID2.json] invalid field name casing in query", checkQuery);
			it("[Courses/invalid/orderNotInColumns.json] invalid ORDER by not in columns", checkQuery);
			it("[Courses/invalid/invalidNesting.json] invalid comparison nesting", checkQuery);
			it("[Courses/invalid/mcompNoKey.json] invalid numeric comparator with no key", checkQuery);
			it("[Courses/invalid/scompNoKey.json] invalid string comparator with no key", checkQuery);
			it("[Courses/invalid/multipleFilter.json] invalid multiple filters", checkQuery);
			it("[Courses/invalid/noUnderscoreKey.json] invalid idstring with no underscore", checkQuery);
			it("[Courses/invalid/noWhere.json] invalid dataset", checkQuery);
			it("[Courses/invalid/mixedDataset.json] invalid mixed datasets", checkQuery);
			it("[Courses/invalid/datasetNotAdded.json] invalid dataset not added", checkQuery);
			it("[Courses/invalid/invalidWildcard.json] invalid wildcard in middle query", checkQuery);
			it("[Courses/invalid/invalidWildcard2.json] invalid wildcard all * query", checkQuery);
			it("[Courses/invalid/invalidWildcard3.json] invalid wildcard all * query", checkQuery);
			it("[Courses/invalid/missingOptions.json] invalid query with missing options", checkQuery);
			it("[Courses/invalid/onlyNot.json] invalid query with only NOT", checkQuery);
			it("[Courses/invalid/emptyAndOr.json] invalid query with empty AND/OR", checkQuery);
			it("[Courses/invalid/multipleKeysComparison.json] invalid multiple key for comparison", checkQuery);
			it("[Courses/invalid/multipleKeysIs.json] invalid multiple key with IS", checkQuery);
			it("[Courses/invalid/keyStartingUnderscore.json] invalid key starts with _", checkQuery);
			it("[Courses/invalid/notMultipleFilters.json] invalid NOT with multiple filters", checkQuery);
			it("[Courses/invalid/comparisonNoKey.json] invalid comparison with no key", checkQuery);
			it("[Courses/invalid/comparisonNoKey.json] invalid IS with no key", checkQuery);
			it("[Courses/invalid/lowercaseClause.json] invalid lowercase clause", checkQuery);
			it("[Courses/invalid/andAsObject.json] invalid AND as object", checkQuery);
			it("[Courses/invalid/orderAsObject.json] invalid ORDER as object", checkQuery);
			it("[Courses/invalid/emptyNot.json] invalid empty NOT", checkQuery);
			it("[Courses/invalid/emptyEqual.json] invalid empty equal", checkQuery);
			it("[Courses/invalid/numberAsString.json] invalid number as string", checkQuery);
			it("[Courses/invalid/emptyGT.json] invalid empty GT filter", checkQuery);
			it("[Courses/invalid/emptyIS.json] invalid empty IS filter", checkQuery);
			it(
				"[Courses/invalid/bothKeys.json] invalid query that tries to use keys from both Sections and Rooms",
				checkQuery
			);
			it("[Courses/invalid/extraOrderKey.json] invalid query that has an extra key in the order object", checkQuery);
			it("[Courses/invalid/invalidOrderDir.json] invalid query that has an invalid dir value", checkQuery);
			it("[Courses/invalid/invalidOrderKeys.json] invalid query that has an invalid key in keys", checkQuery);
			it("[Courses/invalid/emptyOrderKeys.json] invalid query that has an empty order key array", checkQuery);

			// invalid transformation tests
			it("[Courses/invalid/transformationExtraKey.json] invalid query that an extra key in TRANSFORMS", checkQuery);
			it(
				"[Courses/invalid/transformationMissingKey.json] invalid query that is missing a key in TRANSFORMS",
				checkQuery
			);
			it(
				"[Courses/invalid/transformationSameApplyKey.json] invalid query that has two of the same apply key",
				checkQuery
			);
			it("[Courses/invalid/emptyGroup.json] invalid query with empty group", checkQuery);
			it("[Courses/invalid/groupInvalidKey.json] invalid query with an invalid key in group", checkQuery);
			it("[Courses/invalid/invalidApplyKey.json] invalid query with an invalid applykey", checkQuery);
			it("[Courses/invalid/invalidApplyRule.json] invalid query with an invalid apply rule", checkQuery);
			it("[Courses/invalid/invalidAvgKey.json] invalid query that uses a string field for AVG", checkQuery);
			it("[Courses/invalid/invalidMaxKey.json] invalid query that uses a string field for MAX", checkQuery);
			it("[Courses/invalid/invalidMinKey.json] invalid query that uses a string field for MIN", checkQuery);
			it("[Courses/invalid/invalidSumKey.json] invalid query that uses a string field for SUM", checkQuery);

			// Tyler's extra tests
			// Invalid ORDER tests
			it("[Courses/invalid/invalid_order.json] Query has invalid ORDER", checkQuery);

			// Missing argument tests
			it("[Courses/invalid/input_not_object.json] Query has non-object input", checkQuery);

			// valid queries
			it("[Courses/valid/gt.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		});
		describe("PerformQuery - Rooms", function () {
			it("[Rooms/valid/allColumnsRooms.json] valid all columns for Rooms", checkQuery);
			it("[Rooms/valid/transformationComplex.json] valid complex query using all functions", checkQuery);
		});
	});
});

describe("Rooms Dataset", function () {
	let facade: IInsightFacade;
	let oneRoom: string;
	let oneBuilding: string;
	let defaultSeatCheck: string;

	let invalidAbsolutePathsInIndex: string;
	let invalidNoBuilding: string;
	let invalidNoIndex: string;
	let invalidNoRoom: string;
	let invalidWrongClassName: string;
	let invalidWrongStructure: string;

	before(async function () {
		// Load valid datasets
		oneRoom = await getContentFromArchives("validOneRoom.zip");
		oneBuilding = await getContentFromArchives("validOneBuilding.zip");
		defaultSeatCheck = await getContentFromArchives("validDefaultSeatCheck.zip");

		// Load invalid datasets
		invalidAbsolutePathsInIndex = await getContentFromArchives("invalidAbsolutePathsInIndex.zip");
		invalidNoBuilding = await getContentFromArchives("invalidNoBuilding.zip");
		invalidNoIndex = await getContentFromArchives("invalidNoIndex.zip");
		invalidNoRoom = await getContentFromArchives("invalidNoRoom.zip");
		invalidWrongClassName = await getContentFromArchives("invalidWrongClassName.zip");
		invalidWrongStructure = await getContentFromArchives("invalidWrongStructure.zip");
	});

	beforeEach(async function () {
		await clearDisk();
		facade = new InsightFacade();
	});

	it("should add valid one room dataset", async function () {
		const result = await facade.addDataset("rooms", oneRoom, InsightDatasetKind.Rooms);
		expect(result).to.deep.equal(["rooms"]);
		const datasets = await facade.listDatasets();
		expect(datasets).to.deep.equal([
			{
				id: "rooms",
				kind: InsightDatasetKind.Rooms,
				numRows: 1,
			},
		]);
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: [
					"rooms_fullname",
					"rooms_shortname",
					"rooms_number",
					"rooms_name",
					"rooms_address",
					"rooms_lat",
					"rooms_lon",
					"rooms_seats",
					"rooms_type",
					"rooms_furniture",
					"rooms_href",
				],
				ORDER: "rooms_name",
			},
		};
		const resultQuery = await facade.performQuery(query);
		expect(resultQuery).to.have.length(1);
		expect(resultQuery[0]).to.deep.equal({
			rooms_fullname: "Aquatic Ecosystems Research Laboratory",
			rooms_shortname: "AERL",
			rooms_number: "120",
			rooms_name: "AERL_120",
			rooms_address: "2202 Main Mall",
			rooms_lat: 49.26372,
			rooms_lon: -123.25099,
			rooms_seats: 144,
			rooms_type: "Tiered Large Group",
			rooms_furniture: "Classroom-Fixed Tablets",
			rooms_href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/AERL-120",
		});
	});

	it("should add valid one building dataset", async function () {
		const result = await facade.addDataset("rooms", oneBuilding, InsightDatasetKind.Rooms);
		expect(result).to.include("rooms");
		const datasets = await facade.listDatasets();
		const numberOfRooms = 5;
		expect(datasets).to.deep.equal([
			{
				id: "rooms",
				kind: InsightDatasetKind.Rooms,
				numRows: 5,
			},
		]);
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["rooms_fullname", "rooms_number"],
				ORDER: "rooms_number",
			},
		};
		const resultQuery = await facade.performQuery(query);
		expect(resultQuery).to.have.length(numberOfRooms);
		expect(resultQuery[0]).to.deep.equal({
			rooms_fullname: "Hugh Dempster Pavilion",
			rooms_number: "101",
		});
	});

	it("should assign default seat count where missing", async function () {
		const result = await facade.addDataset("rooms", defaultSeatCheck, InsightDatasetKind.Rooms);
		expect(result).to.include("rooms");
		const datasets = await facade.listDatasets();
		expect(datasets).to.deep.equal([
			{
				id: "rooms",
				kind: InsightDatasetKind.Rooms,
				numRows: 5,
			},
		]);
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["rooms_fullname", "rooms_seats"],
				ORDER: "rooms_fullname",
			},
		};
		const resultQuery = await facade.performQuery(query);
		for (const row of resultQuery) {
			expect(row.rooms_seats).to.equal(0);
		}
	});

	it("should reject dataset with absolute paths in index", async function () {
		try {
			await facade.addDataset("rooms", invalidAbsolutePathsInIndex, InsightDatasetKind.Rooms);
			expect.fail("Expected InsightError due to absolute paths in index");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});
	it("should reject dataset with no building", async function () {
		try {
			await facade.addDataset("rooms", invalidNoBuilding, InsightDatasetKind.Rooms);
			expect.fail("Expected InsightError due to missing building");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});
	it("should reject dataset with no index", async function () {
		try {
			await facade.addDataset("rooms", invalidNoIndex, InsightDatasetKind.Rooms);
			expect.fail("Expected InsightError due to missing index");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});
	it("should reject dataset with no room", async function () {
		try {
			await facade.addDataset("rooms", invalidNoRoom, InsightDatasetKind.Rooms);
			expect.fail("Expected InsightError due to missing room");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});
	it("should reject dataset with wrong class name", async function () {
		try {
			await facade.addDataset("rooms", invalidWrongClassName, InsightDatasetKind.Rooms);
			expect.fail("Expected InsightError due to wrong class name");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});
	it("should reject dataset with wrong structure", async function () {
		try {
			await facade.addDataset("rooms", invalidWrongStructure, InsightDatasetKind.Rooms);
			expect.fail("Expected InsightError due to wrong structure");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});

	it("should reject adding a dataset with an empty id", async function () {
		try {
			await facade.addDataset("", oneRoom, InsightDatasetKind.Rooms);
			expect.fail("Expected InsightError due to empty dataset id");
		} catch (err) {
			expect(err).to.be.instanceOf(InsightError);
		}
	});

	it("should remove Room Dataset successfully", async function () {
		await facade.addDataset("rooms", oneRoom, InsightDatasetKind.Rooms);
		const result = await facade.removeDataset("rooms");
		expect(result).to.equal("rooms");
		const datasets = await facade.listDatasets();
		expect(datasets).to.deep.equal([]);
	});
	it("should add room and sections datasets successfully", async function () {
		const smallSection = await getContentFromArchives("validSmall.zip");
		await facade.addDataset("rooms", oneRoom, InsightDatasetKind.Rooms);
		const result = await facade.addDataset("sections", smallSection, InsightDatasetKind.Sections);
		expect(result).to.deep.equal(["rooms", "sections"]);
		const datasets = await facade.listDatasets();
		expect(datasets).to.have.length(2);
		expect(datasets[0].id).to.equal("rooms");
		expect(datasets[1].id).to.equal("sections");
	});
});

describe("PerformQuery - Rooms", function () {
	let facade: IInsightFacade;

	before(async function () {
		await clearDisk();
		facade = new InsightFacade();
		const campus = await getContentFromArchives("campus.zip");
		await facade.addDataset("rooms", campus, InsightDatasetKind.Rooms);
	});

	after(async function () {
		await clearDisk();
	});

	async function checkQuery(this: Mocha.Context): Promise<void> {
		if (!this.test) throw new Error("checkQuery must be used within a test");
		const { input, expected, errorExpected } = await loadTestQuery(this.test.title);

		try {
			const result = await facade.performQuery(input);
			if (errorExpected) {
				expect.fail("Expected query to fail, but it passed.");
			}
			expect(result).to.have.deep.members(expected);
			expect(result).to.have.length(expected.length);
		} catch (err) {
			if (!errorExpected) {
				expect.fail(`Unexpected error: ${err}`);
			}
			if (expected === "InsightError") {
				expect(err).to.be.instanceOf(InsightError);
			} else if (expected === "ResultTooLargeError") {
				expect(err).to.be.instanceOf(ResultTooLargeError);
			} else {
				expect.fail(`Unknown expected error: ${expected}`);
			}
		}
	}
	// -----------------------------------valid queries-----------------------------------
	it("[Rooms/valid/validDuplicateTransformation.json] valid query with duplicate transformation keys", checkQuery);
	it("[Rooms/valid/applyAllFunctions.json] valid applying all functions", checkQuery);
	it("[Rooms/valid/roomInfo.json] valid query for specific room info", checkQuery);

	// -----------------------------------invalid queries-----------------------------------
	it("[Rooms/invalid/duplicateTransformation.json] invalid query with duplicate transformation keys", checkQuery);
	it("[Rooms/invalid/invalidKeyTransformation.json] invalid key in transformation", checkQuery);
	it("[Rooms/invalid/invalidSectionTransformation.json] invalid S-key in where  ", checkQuery);
	it("[Rooms/invalid/invalidTransformation.json] invalid transformation", checkQuery);
});
