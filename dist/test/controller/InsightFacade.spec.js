"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const TestUtil_1 = require("../TestUtil");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
describe("InsightFacade", function () {
    let facade;
    let smallSection;
    let emptyZip;
    let emptySections;
    let bigSections;
    let invalidJson;
    let singleSection;
    let invalidFolderName;
    let invalidZip;
    let corruptCourse;
    let invalidFolderPath;
    let invalidSections;
    let noCourses;
    let invalidJson2;
    before(async function () {
        smallSection = await (0, TestUtil_1.getContentFromArchives)("validSmall.zip");
        emptyZip = await (0, TestUtil_1.getContentFromArchives)("empty.zip");
        emptySections = await (0, TestUtil_1.getContentFromArchives)("emptySection.zip");
        bigSections = await (0, TestUtil_1.getContentFromArchives)("pair.zip");
        invalidJson = await (0, TestUtil_1.getContentFromArchives)("invalidJson.zip");
        invalidJson2 = await (0, TestUtil_1.getContentFromArchives)("invalid_json.zip");
        singleSection = await (0, TestUtil_1.getContentFromArchives)("singleSection.zip");
        invalidFolderName = await (0, TestUtil_1.getContentFromArchives)("invalidFolderName.zip");
        invalidZip = await (0, TestUtil_1.getContentFromArchives)("invalidStructure.zip");
        corruptCourse = await (0, TestUtil_1.getContentFromArchives)("corruptCourse.zip");
        invalidFolderPath = await (0, TestUtil_1.getContentFromArchives)("invalidPath.zip");
        invalidSections = await (0, TestUtil_1.getContentFromArchives)("invalidSection.zip");
        noCourses = await (0, TestUtil_1.getContentFromArchives)("no_courses_directory.zip");
    });
    describe("addDataset", function () {
        beforeEach(async function () {
            await (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        it("should reject adding with an empty dataset id", async function () {
            const result = facade.addDataset("", bigSections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset id with underscore", async function () {
            const invalidId = "wrong_id";
            const result = facade.addDataset(invalidId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset id with only underscore", async function () {
            const invalidId = "_";
            const result = facade.addDataset(invalidId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset id with only whitespaces", async function () {
            const invalidId = "\t\n ";
            const result = facade.addDataset(invalidId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset id with only one whitespace", async function () {
            const invalidId = " ";
            const result = facade.addDataset(invalidId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset id with multiple underscores", async function () {
            const invalidId = "wrong_id_id";
            const result = facade.addDataset(invalidId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset id that ends with underscore", async function () {
            const invalidId = "wrongId_";
            const result = facade.addDataset(invalidId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset id that starts and ends with underscore", async function () {
            const invalidId = "_wrong_id_";
            const result = facade.addDataset(invalidId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset with invalid kind", async function () {
            const result = facade.addDataset("ubc", smallSection, null);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset with empty content", async function () {
            const id = "ubc";
            const result = facade.addDataset(id, emptyZip, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding the same dataset id again after another operation", async function () {
            await facade.addDataset("ubc", smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.listDatasets();
            const result = facade.addDataset("ubc", smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset if it already exists", async function () {
            const id = "ubc";
            try {
                const result1 = await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result1).to.deep.equal([id]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
            }
            try {
                const result2 = await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail(`Expected rejection for adding existing dataset, but got: ${result2}`);
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
            const listResult = await facade.listDatasets();
            (0, chai_1.expect)(listResult).to.have.length(1);
            (0, chai_1.expect)(listResult).to.deep.equal([
                {
                    id: id,
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 39,
                },
            ]);
        });
        it("should rejects dataset with corrupt base64 content", async () => {
            const corruptString = "!!@@notbase64###";
            const add = facade.addDataset("badData", corruptString, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, chai_1.expect)(add).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
            const current = await facade.listDatasets();
            (0, chai_1.expect)(current).to.be.an("array").that.is.empty;
        });
        it("should reject adding dataset with invalid zipfile content", async function () {
            const id = "ubc";
            const result = facade.addDataset(id, "abcd", IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset with invalid folder name content", async function () {
            const id = "ubc";
            const result = facade.addDataset(id, invalidFolderName, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset with invalid json format content", async function () {
            const id = "ubc";
            const result = facade.addDataset(id, invalidJson, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset with invalid zipfile structure content", async function () {
            const id = "ubc";
            const result = facade.addDataset(id, invalidZip, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset with corrupt course content", async function () {
            const id = "ubc";
            const result = facade.addDataset(id, corruptCourse, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset with invalid empty folder content", async function () {
            const id = "ubc";
            const result = facade.addDataset(id, invalidFolderName, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset with invalid folder path content", async function () {
            const id = "ubc";
            const result = facade.addDataset(id, invalidFolderPath, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset with empty sections  content", async function () {
            const id = "ubc";
            const result = facade.addDataset(id, emptySections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset with invalid content", async function () {
            const id = "ubc";
            const invalidContent = "";
            const result = facade.addDataset(id, invalidContent, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding invalid sections dataset with no sections content", async function () {
            const id = "ubc";
            const result = facade.addDataset(id, invalidSections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should pass adding with valid dataset id", async function () {
            const id = "ubc";
            try {
                const result = await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result).to.deep.equal([id]);
                const listResult = await facade.listDatasets();
                (0, chai_1.expect)(listResult).to.have.length(1);
                (0, chai_1.expect)(listResult).to.deep.equal([
                    {
                        id: id,
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: 39,
                    },
                ]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
            }
        });
        it("should pass adding with valid dataset id to a big dataset", async function () {
            const id = "ubcBig";
            try {
                const result = await facade.addDataset(id, bigSections, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result).to.deep.equal([id]);
                const listResult = await facade.listDatasets();
                (0, chai_1.expect)(listResult).to.have.length(1);
                (0, chai_1.expect)(listResult).to.deep.equal([
                    {
                        id: id,
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: 64612,
                    },
                ]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of big dataset, but got error: ${err}`);
            }
        });
        it("should pass adding with valid dataset id with special characters", async function () {
            const id = "ubc!@#$%^&*() 123 -=+ ?[]{}";
            const result = await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.deep.equal([id]);
        });
        it("should pass adding with valid dataset id with only one character", async function () {
            const id = "a";
            try {
                const result = await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result).to.deep.equal([id]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
            }
        });
        it("should pass adding with valid dataset id with different case", async function () {
            const id = "ubcID";
            const result = await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            (0, chai_1.expect)(result).to.deep.equal([id]);
            (0, chai_1.expect)(result).to.have.length(1);
            const datasets = await facade.listDatasets();
            (0, chai_1.expect)(datasets).to.have.length(1);
            (0, chai_1.expect)(datasets).to.have.deep.equal([
                {
                    id: id,
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 39,
                },
            ]);
        });
        it("should pass adding with valid dataset id after removing it", async function () {
            const id = "ubc";
            try {
                await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.removeDataset(id);
                const result = await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result).to.deep.equal([id]);
                (0, chai_1.expect)(result).to.have.length(1);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
            }
        });
        it("should pass adding with valid similar dataset ids", async function () {
            const firstId = "ubc";
            const secondId = "ubc2";
            try {
                const firstAdd = await facade.addDataset(firstId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(firstAdd).to.have.length(1);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of first dataset, but got error: ${err}`);
            }
            try {
                const secondAdd = await facade.addDataset(secondId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(secondAdd).to.have.length(2);
                (0, chai_1.expect)(secondAdd).to.have.deep.equal([firstId, secondId]);
                const datasets = await facade.listDatasets();
                (0, chai_1.expect)(datasets).to.have.length(2);
                (0, chai_1.expect)(datasets).to.have.deep.equal([
                    {
                        id: firstId,
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: 39,
                    },
                    {
                        id: secondId,
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: 39,
                    },
                ]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of second dataset, but got error: ${err}`);
            }
        });
        it("should pass adding with valid three different dataset ids", async function () {
            const id1 = "ubc2";
            const id2 = "ubc2 ";
            const id3 = "ubc 2";
            try {
                const result1 = await facade.addDataset(id1, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result1).to.deep.equal([id1]);
                const result2 = await facade.addDataset(id2, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result2).to.have.deep.members([id1, id2]);
                const result3 = await facade.addDataset(id3, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result3).to.have.deep.members([id1, id2, id3]);
                const datasets = await facade.listDatasets();
                const length = 3;
                (0, chai_1.expect)(datasets).to.have.length(length);
                (0, chai_1.expect)(datasets).to.have.deep.equal([
                    {
                        id: id1,
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: 39,
                    },
                    {
                        id: id2,
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: 39,
                    },
                    {
                        id: id3,
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: 39,
                    },
                ]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of three datasets, but got error: ${err}`);
            }
        });
        it("should pass adding with valid dataset id with single section", async function () {
            const id = "ubcSingle";
            try {
                const result = await facade.addDataset(id, singleSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result).to.deep.equal([id]);
                const datasets = await facade.listDatasets();
                (0, chai_1.expect)(datasets).to.have.length(1);
                (0, chai_1.expect)(datasets).to.have.deep.equal([
                    {
                        id: id,
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: 1,
                    },
                ]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
            }
        });
        it("should pass keep the valid dataset after adding an invalid dataset", async function () {
            const id1 = "ubc";
            const id2 = "invalid";
            try {
                await facade.addDataset(id1, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset(id2, emptyZip, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Expected InsightError due to invalid dataset");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
            const datasets = await facade.listDatasets();
            (0, chai_1.expect)(datasets).to.have.length(1);
            (0, chai_1.expect)(datasets).to.have.deep.equal([
                {
                    id: id1,
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 39,
                },
            ]);
        });
        it("should pass adding dataset if it already exists with different case", async function () {
            const id1 = "ubc";
            const id2 = "uBc";
            try {
                await facade.addDataset(id1, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of datasets, but got error: ${err}`);
            }
            try {
                const result = await facade.addDataset(id2, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result).to.contain(id1);
                (0, chai_1.expect)(result).to.contain(id2);
                (0, chai_1.expect)(result).to.have.length(2);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
            }
        });
        it("should reject a content where there is no courses directory", async function () {
            try {
                await facade.addDataset("dataset", noCourses, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Should have thrown!");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject a content non-JSON formatted courses", async function () {
            try {
                await facade.addDataset("dataset", invalidJson2, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Should have thrown!");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
    });
    describe("removeDataset", function () {
        beforeEach(async function () {
            await (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        it("should reject removing with an empty dataset id", async function () {
            const id = "";
            const result = facade.removeDataset(id);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject removing with an invalid dataset id", async function () {
            const invalidId = "invalid_id";
            const result = facade.removeDataset(invalidId);
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject removing a dataset id with only whitespace", async function () {
            const invalidId = " ";
            try {
                await facade.addDataset(invalidId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.removeDataset(invalidId);
                chai_1.expect.fail("Expected InsightError due to id with only whitespace");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject removing with a dataset id that doesn't exist", async function () {
            const invalidId = "nonExistedId";
            const validId = "ubc";
            try {
                await facade.addDataset(validId, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.removeDataset(invalidId);
                chai_1.expect.fail("Expected InsightError due to id with removing an id that doesnt exist");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.NotFoundError);
            }
        });
        it("should pass with the same dataset id added and removed multiple times", async function () {
            const id = "ubc";
            try {
                await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.removeDataset(id);
                const result = await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result).to.deep.equal([id]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful addition of dataset, but got error: ${err}`);
            }
        });
        it("should pass removing a valid dataset id", async function () {
            const id = "ubc";
            try {
                await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                const result = await facade.removeDataset(id);
                (0, chai_1.expect)(result).to.equal(id);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful removal of dataset, but got error: ${err}`);
            }
        });
        it("should pass removing a dataset id with different case", async function () {
            const id1 = "ubc";
            const id2 = "UBC";
            try {
                await facade.addDataset(id1, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.removeDataset(id2);
                chai_1.expect.fail("Expected InsightError due to case-sensitive dataset id");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.NotFoundError);
            }
        });
        it("should reject removing a dataset id that has already been removed", async function () {
            const id = "ubc";
            try {
                await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.removeDataset(id);
                await facade.removeDataset(id);
                chai_1.expect.fail("Expected InsightError due to already removed dataset id");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.NotFoundError);
            }
        });
        it("should pass with removing valid dataset ids", async function () {
            const id1 = "ubc";
            const id2 = "ubc2";
            try {
                await facade.addDataset(id1, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset(id2, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                const result1 = await facade.removeDataset(id1);
                const result2 = await facade.removeDataset(id2);
                (0, chai_1.expect)(result1).to.include(id1);
                (0, chai_1.expect)(result2).to.equal(id2);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful removal of datasets, but got error: ${err}`);
            }
        });
        it("should remove the correct dataset when there are several datasets", async function () {
            try {
                await facade.addDataset("sections", smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset("removethis", bigSections, IInsightFacade_1.InsightDatasetKind.Sections);
                const id = await facade.removeDataset("removethis");
                (0, chai_1.expect)(id).to.eq("removethis");
                const actual = await facade.listDatasets();
                const expected = [
                    {
                        id: "sections",
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: 39,
                    },
                ];
                (0, chai_1.expect)(actual).to.deep.equal(expected);
            }
            catch (err) {
                chai_1.expect.fail("Should have passed but instead got: " + err);
            }
        });
        it("removeDataset: should reject an id that is only whitespace", async function () {
            try {
                await facade.removeDataset(" \t\n");
                chai_1.expect.fail("Should have thrown!");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
    });
    describe("listDatasets", function () {
        beforeEach(async function () {
            await (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        it("should return an empty array when no datasets are added", async function () {
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.deep.equal([]);
        });
        it("should return an array with one dataset when one is added", async function () {
            const id = "ubc";
            try {
                await facade.addDataset(id, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                const result = await facade.listDatasets();
                (0, chai_1.expect)(result).to.have.length(1);
                (0, chai_1.expect)(result).to.be.deep.equal([
                    {
                        id: id,
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: 39,
                    },
                ]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
            }
        });
        it("should return an array with multiple datasets when multiple are added", async function () {
            const id1 = "ubc";
            const id2 = "ubc2";
            try {
                await facade.addDataset(id1, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset(id2, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                const result = await facade.listDatasets();
                (0, chai_1.expect)(result).to.have.length(2);
                (0, chai_1.expect)(result).to.have.deep.equal([
                    { id: id1, kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 39 },
                    { id: id2, kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 39 },
                ]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
            }
        });
        it("should return an array with remaining datasets when some are removed", async function () {
            const id1 = "ubc";
            const id2 = "ubc2";
            try {
                await facade.addDataset(id1, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset(id2, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.removeDataset(id1);
                const result = await facade.listDatasets();
                (0, chai_1.expect)(result).to.have.length(1);
                (0, chai_1.expect)(result[0].id).to.equal(id2);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
            }
        });
        it("should return an empty array when all datasets are removed", async function () {
            const id1 = "ubc";
            const id2 = "ubc2";
            try {
                await facade.addDataset(id1, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset(id2, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.removeDataset(id1);
                await facade.removeDataset(id2);
                const result = await facade.listDatasets();
                (0, chai_1.expect)(result).to.deep.equal([]);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
            }
        });
        it("should return an array with remaining datasets when some are added and some are removed", async function () {
            const id1 = "ubc";
            const id2 = "ubc2";
            try {
                await facade.addDataset(id1, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset(id2, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.removeDataset(id1);
                const result = await facade.listDatasets();
                (0, chai_1.expect)(result).to.have.length(1);
                (0, chai_1.expect)(result[0].id).to.equal(id2);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
            }
        });
        it("should return an array with remaining datasets when some 2nd dataset is removed", async function () {
            const id1 = "ubc";
            const id2 = "ubc2";
            try {
                await facade.addDataset(id1, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset(id2, smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.removeDataset(id2);
                const result = await facade.listDatasets();
                (0, chai_1.expect)(result).to.have.length(1);
                (0, chai_1.expect)(result[0].id).to.equal(id1);
            }
            catch (err) {
                chai_1.expect.fail(`Expected successful listing of datasets, but got error: ${err}`);
            }
        });
    });
    describe("PerformQuery with an empty dataset", function () {
        before(function () {
            facade = new InsightFacade_1.default();
        });
        after(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        const input = {
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
            return (0, chai_1.expect)(result).to.be.eventually.rejectedWith(IInsightFacade_1.InsightError);
        });
    });
    describe("PerformQuery", function () {
        async function checkQuery() {
            if (!this.test) {
                throw new Error("Invalid call to checkQuery." +
                    "Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
                    "Do not invoke the function directly.");
            }
            const { input, expected, errorExpected } = await (0, TestUtil_1.loadTestQuery)(this.test.title);
            let result = [];
            try {
                result = await facade.performQuery(input);
                if (errorExpected) {
                    chai_1.expect.fail("performQuery should have rejected but resolved instead.");
                }
                (0, chai_1.expect)(result).to.have.deep.members(expected);
                (0, chai_1.expect)(result).to.have.length(expected.length);
            }
            catch (err) {
                if (!errorExpected) {
                    chai_1.expect.fail(`performQuery threw unexpected error: ${err}`);
                }
                if (expected === "InsightError") {
                    (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
                }
                else if (expected === "ResultTooLargeError") {
                    (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.ResultTooLargeError);
                }
                else {
                    chai_1.expect.fail(`Unknown expected error: ${expected}`);
                }
            }
        }
        before(async function () {
            facade = new InsightFacade_1.default();
            const sectionsAll = await (0, TestUtil_1.getContentFromArchives)("pair.zip");
            const single = await (0, TestUtil_1.getContentFromArchives)("singleSection.zip");
            const campus = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
            await facade.addDataset("sections", sectionsAll, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("single", single, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("rooms", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
        });
        after(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        describe("PerformQuery - Courses", function () {
            it("[Courses/valid/matchExactly.json] valid match exactly", checkQuery);
            it("[Courses/valid/startsWith.json] valid wildcard at te begining", checkQuery);
            it("[Courses/valid/endsWith.json] valid wildcard at the end", checkQuery);
            it("[Courses/valid/contains.json] valid wildcard contains ps", checkQuery);
            it("[Courses/valid/noResult.json] valid no result", checkQuery);
            it("[Courses/valid/largerThan.json] valid greater than", checkQuery);
            it("[Courses/valid/lessThan.json] valid less than", checkQuery);
            it("[Courses/valid/lessThanEqual.json] valid less than or equal", checkQuery);
            it("[Courses/valid/greaterThanEqual.json] valid greater than or equal", checkQuery);
            it("[Courses/valid/equal.json] valid equal", checkQuery);
            it("[Courses/valid/overlappingComparison.json] valid overlapping comparison", checkQuery);
            it("[Courses/valid/overlappingComparison2.json] valid overlapping comparison", checkQuery);
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
            it("[Courses/valid/allColumns.json] valid all columns", checkQuery);
            it("[Courses/valid/orderByString.json] valid ORDER by string field", checkQuery);
            it("[Courses/valid/orderByNumber.json] valid ORDER by numeric field", checkQuery);
            it("[Courses/valid/orderDirKeys.json] valid ORDER DOWN by number and string fields", checkQuery);
            it("[Courses/valid/orderDirKeys2.json] valid ORDER UP by numeric and string fields", checkQuery);
            it("[Courses/valid/emptyApply.json] valid query with an empty apply list", checkQuery);
            it("[Courses/valid/transformationAvg.json] valid query with AVG", checkQuery);
            it("[Courses/valid/transformationCountNumeric.json] valid query with numeric COUNT", checkQuery);
            it("[Courses/valid/transformationCountString.json] valid query with string COUNT", checkQuery);
            it("[Courses/valid/transformationManyApply.json] valid query with more than 1 apply rule", checkQuery);
            it("[Courses/valid/transformationMax.json] valid query with MAX", checkQuery);
            it("[Courses/valid/transformationMin.json] valid query with MIN", checkQuery);
            it("[Courses/valid/transformationSum.json] valid query with SUM", checkQuery);
            it("[Courses/valid/limit5000.json] valid query with limit 5000", checkQuery);
            it("[Courses/valid/limit4999.json] valid query with limit 4999", checkQuery);
            it("[Courses/valid/complexQuery.json] valid complex query", checkQuery);
            it("[Courses/valid/complexQuery2.json] valid complex query", checkQuery);
            it("[Courses/valid/allParameters.json] valid query with all parameters", checkQuery);
            it("[Courses/valid/caseSensitiveScomp.json] valid case sensitive query", checkQuery);
            it("[Courses/valid/duplicateColumn.json] valid query with duplicate columns", checkQuery);
            it("[Courses/valid/whereAtTheEnd.json] valid query with WHERE at the end", checkQuery);
            it("[Courses/valid/emptyWildcard.json] valid empty wildcard", checkQuery);
            it("[Courses/valid/deeplyNested.json] valid deeply nested query", checkQuery);
            it("[Courses/valid/differentId.json] valid query but different id from the others", checkQuery);
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
            it("[Courses/invalid/bothKeys.json] invalid query that tries to use keys from both Sections and Rooms", checkQuery);
            it("[Courses/invalid/extraOrderKey.json] invalid query that has an extra key in the order object", checkQuery);
            it("[Courses/invalid/invalidOrderDir.json] invalid query that has an invalid dir value", checkQuery);
            it("[Courses/invalid/invalidOrderKeys.json] invalid query that has an invalid key in keys", checkQuery);
            it("[Courses/invalid/emptyOrderKeys.json] invalid query that has an empty order key array", checkQuery);
            it("[Courses/invalid/transformationExtraKey.json] invalid query that an extra key in TRANSFORMS", checkQuery);
            it("[Courses/invalid/transformationMissingKey.json] invalid query that is missing a key in TRANSFORMS", checkQuery);
            it("[Courses/invalid/transformationSameApplyKey.json] invalid query that has two of the same apply key", checkQuery);
            it("[Courses/invalid/emptyGroup.json] invalid query with empty group", checkQuery);
            it("[Courses/invalid/groupInvalidKey.json] invalid query with an invalid key in group", checkQuery);
            it("[Courses/invalid/invalidApplyKey.json] invalid query with an invalid applykey", checkQuery);
            it("[Courses/invalid/invalidApplyRule.json] invalid query with an invalid apply rule", checkQuery);
            it("[Courses/invalid/invalidAvgKey.json] invalid query that uses a string field for AVG", checkQuery);
            it("[Courses/invalid/invalidMaxKey.json] invalid query that uses a string field for MAX", checkQuery);
            it("[Courses/invalid/invalidMinKey.json] invalid query that uses a string field for MIN", checkQuery);
            it("[Courses/invalid/invalidSumKey.json] invalid query that uses a string field for SUM", checkQuery);
            it("[Courses/invalid/invalid_order.json] Query has invalid ORDER", checkQuery);
            it("[Courses/invalid/input_not_object.json] Query has non-object input", checkQuery);
            it("[Courses/valid/gt.json] SELECT dept, avg WHERE avg > 97", checkQuery);
        });
        describe("PerformQuery - Rooms", function () {
            it("[Rooms/valid/allColumnsRooms.json] valid all columns for Rooms", checkQuery);
            it("[Rooms/valid/transformationComplex.json] valid complex query using all functions", checkQuery);
        });
    });
});
describe("Rooms Dataset", function () {
    let facade;
    let oneRoom;
    let oneBuilding;
    let defaultSeatCheck;
    let invalidAbsolutePathsInIndex;
    let invalidNoBuilding;
    let invalidNoIndex;
    let invalidNoRoom;
    let invalidWrongClassName;
    let invalidWrongStructure;
    before(async function () {
        oneRoom = await (0, TestUtil_1.getContentFromArchives)("validOneRoom.zip");
        oneBuilding = await (0, TestUtil_1.getContentFromArchives)("validOneBuilding.zip");
        defaultSeatCheck = await (0, TestUtil_1.getContentFromArchives)("validDefaultSeatCheck.zip");
        invalidAbsolutePathsInIndex = await (0, TestUtil_1.getContentFromArchives)("invalidAbsolutePathsInIndex.zip");
        invalidNoBuilding = await (0, TestUtil_1.getContentFromArchives)("invalidNoBuilding.zip");
        invalidNoIndex = await (0, TestUtil_1.getContentFromArchives)("invalidNoIndex.zip");
        invalidNoRoom = await (0, TestUtil_1.getContentFromArchives)("invalidNoRoom.zip");
        invalidWrongClassName = await (0, TestUtil_1.getContentFromArchives)("invalidWrongClassName.zip");
        invalidWrongStructure = await (0, TestUtil_1.getContentFromArchives)("invalidWrongStructure.zip");
    });
    beforeEach(async function () {
        await (0, TestUtil_1.clearDisk)();
        facade = new InsightFacade_1.default();
    });
    it("should add valid one room dataset", async function () {
        const result = await facade.addDataset("rooms", oneRoom, IInsightFacade_1.InsightDatasetKind.Rooms);
        (0, chai_1.expect)(result).to.deep.equal(["rooms"]);
        const datasets = await facade.listDatasets();
        (0, chai_1.expect)(datasets).to.deep.equal([
            {
                id: "rooms",
                kind: IInsightFacade_1.InsightDatasetKind.Rooms,
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
        (0, chai_1.expect)(resultQuery).to.have.length(1);
        (0, chai_1.expect)(resultQuery[0]).to.deep.equal({
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
        const result = await facade.addDataset("rooms", oneBuilding, IInsightFacade_1.InsightDatasetKind.Rooms);
        (0, chai_1.expect)(result).to.include("rooms");
        const datasets = await facade.listDatasets();
        const numberOfRooms = 5;
        (0, chai_1.expect)(datasets).to.deep.equal([
            {
                id: "rooms",
                kind: IInsightFacade_1.InsightDatasetKind.Rooms,
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
        (0, chai_1.expect)(resultQuery).to.have.length(numberOfRooms);
        (0, chai_1.expect)(resultQuery[0]).to.deep.equal({
            rooms_fullname: "Hugh Dempster Pavilion",
            rooms_number: "101",
        });
    });
    it("should assign default seat count where missing", async function () {
        const result = await facade.addDataset("rooms", defaultSeatCheck, IInsightFacade_1.InsightDatasetKind.Rooms);
        (0, chai_1.expect)(result).to.include("rooms");
        const datasets = await facade.listDatasets();
        (0, chai_1.expect)(datasets).to.deep.equal([
            {
                id: "rooms",
                kind: IInsightFacade_1.InsightDatasetKind.Rooms,
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
            (0, chai_1.expect)(row.rooms_seats).to.equal(0);
        }
    });
    it("should reject dataset with absolute paths in index", async function () {
        try {
            await facade.addDataset("rooms", invalidAbsolutePathsInIndex, IInsightFacade_1.InsightDatasetKind.Rooms);
            chai_1.expect.fail("Expected InsightError due to absolute paths in index");
        }
        catch (err) {
            (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    });
    it("should reject dataset with no building", async function () {
        try {
            await facade.addDataset("rooms", invalidNoBuilding, IInsightFacade_1.InsightDatasetKind.Rooms);
            chai_1.expect.fail("Expected InsightError due to missing building");
        }
        catch (err) {
            (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    });
    it("should reject dataset with no index", async function () {
        try {
            await facade.addDataset("rooms", invalidNoIndex, IInsightFacade_1.InsightDatasetKind.Rooms);
            chai_1.expect.fail("Expected InsightError due to missing index");
        }
        catch (err) {
            (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    });
    it("should reject dataset with no room", async function () {
        try {
            await facade.addDataset("rooms", invalidNoRoom, IInsightFacade_1.InsightDatasetKind.Rooms);
            chai_1.expect.fail("Expected InsightError due to missing room");
        }
        catch (err) {
            (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    });
    it("should reject dataset with wrong class name", async function () {
        try {
            await facade.addDataset("rooms", invalidWrongClassName, IInsightFacade_1.InsightDatasetKind.Rooms);
            chai_1.expect.fail("Expected InsightError due to wrong class name");
        }
        catch (err) {
            (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    });
    it("should reject dataset with wrong structure", async function () {
        try {
            await facade.addDataset("rooms", invalidWrongStructure, IInsightFacade_1.InsightDatasetKind.Rooms);
            chai_1.expect.fail("Expected InsightError due to wrong structure");
        }
        catch (err) {
            (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    });
    it("should reject adding a dataset with an empty id", async function () {
        try {
            await facade.addDataset("", oneRoom, IInsightFacade_1.InsightDatasetKind.Rooms);
            chai_1.expect.fail("Expected InsightError due to empty dataset id");
        }
        catch (err) {
            (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    });
    it("should remove Room Dataset successfully", async function () {
        await facade.addDataset("rooms", oneRoom, IInsightFacade_1.InsightDatasetKind.Rooms);
        const result = await facade.removeDataset("rooms");
        (0, chai_1.expect)(result).to.equal("rooms");
        const datasets = await facade.listDatasets();
        (0, chai_1.expect)(datasets).to.deep.equal([]);
    });
    it("should add room and sections datasets successfully", async function () {
        const smallSection = await (0, TestUtil_1.getContentFromArchives)("validSmall.zip");
        await facade.addDataset("rooms", oneRoom, IInsightFacade_1.InsightDatasetKind.Rooms);
        const result = await facade.addDataset("sections", smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
        (0, chai_1.expect)(result).to.deep.equal(["rooms", "sections"]);
        const datasets = await facade.listDatasets();
        (0, chai_1.expect)(datasets).to.have.length(2);
        (0, chai_1.expect)(datasets[0].id).to.equal("rooms");
        (0, chai_1.expect)(datasets[1].id).to.equal("sections");
    });
});
describe("PerformQuery - Rooms", function () {
    let facade;
    before(async function () {
        await (0, TestUtil_1.clearDisk)();
        facade = new InsightFacade_1.default();
        const campus = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        await facade.addDataset("rooms", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
    });
    after(async function () {
        await (0, TestUtil_1.clearDisk)();
    });
    async function checkQuery() {
        if (!this.test)
            throw new Error("checkQuery must be used within a test");
        const { input, expected, errorExpected } = await (0, TestUtil_1.loadTestQuery)(this.test.title);
        try {
            const result = await facade.performQuery(input);
            if (errorExpected) {
                chai_1.expect.fail("Expected query to fail, but it passed.");
            }
            (0, chai_1.expect)(result).to.have.deep.members(expected);
            (0, chai_1.expect)(result).to.have.length(expected.length);
        }
        catch (err) {
            if (!errorExpected) {
                chai_1.expect.fail(`Unexpected error: ${err}`);
            }
            if (expected === "InsightError") {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
            else if (expected === "ResultTooLargeError") {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.ResultTooLargeError);
            }
            else {
                chai_1.expect.fail(`Unknown expected error: ${expected}`);
            }
        }
    }
    it("[Rooms/valid/validDuplicateTransformation.json] valid query with duplicate transformation keys", checkQuery);
    it("[Rooms/valid/applyAllFunctions.json] valid applying all functions", checkQuery);
    it("[Rooms/valid/roomInfo.json] valid query for specific room info", checkQuery);
    it("[Rooms/invalid/duplicateTransformation.json] invalid query with duplicate transformation keys", checkQuery);
    it("[Rooms/invalid/invalidKeyTransformation.json] invalid key in transformation", checkQuery);
    it("[Rooms/invalid/invalidSectionTransformation.json] invalid S-key in where  ", checkQuery);
    it("[Rooms/invalid/invalidTransformation.json] invalid transformation", checkQuery);
});
//# sourceMappingURL=InsightFacade.spec.js.map