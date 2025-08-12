"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const chai_1 = require("chai");
const TestUtil_1 = require("../TestUtil");
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const DatasetParser_1 = require("../../src/model/Dataset/CourseDataset/DatasetParser");
const DiskUtil_1 = require("../../src/util/DiskUtil");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const DiskUtil_2 = require("../../src/util/DiskUtil");
const fs_extra_1 = __importDefault(require("fs-extra"));
(0, chai_1.use)(chai_as_promised_1.default);
const DATA_DIR = "./data";
describe("diskUtil", function () {
    describe("saveDataset", function () {
        beforeEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should write a json file given a valid Dataset", async function () {
            const content = await (0, TestUtil_1.getContentFromArchives)("singleSection.zip");
            const dataset = await (0, DatasetParser_1.parseDataset)("sections", content, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, DiskUtil_1.saveDataset)(dataset);
            const result = JSON.parse(await fs_extra_1.default.readFile(`${DATA_DIR}/sections.json`, "utf8"));
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
            (0, chai_1.expect)(result).to.deep.equal(answer);
        });
        it("should write a json file with multiple sections", async function () {
            const content = await (0, TestUtil_1.getContentFromArchives)("threeCourses.zip");
            const dataset = await (0, DatasetParser_1.parseDataset)("threeCourses", content, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, DiskUtil_1.saveDataset)(dataset);
            const result = JSON.parse(await fs_extra_1.default.readFile(`${DATA_DIR}/threeCourses.json`, "utf8"));
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
            (0, chai_1.expect)(result).to.deep.equal(answer);
        });
    });
    describe("loadDataset", function () {
        beforeEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should load a valid .json file given the correct id", async function () {
            const content = await (0, TestUtil_1.getContentFromArchives)("threeCourses.zip");
            const dataset = await (0, DatasetParser_1.parseDataset)("threeCourses", content, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, DiskUtil_1.saveDataset)(dataset);
            const result = await (0, DiskUtil_1.loadDataset)("threeCourses");
            if (!result) {
                chai_1.expect.fail("result should not be null");
            }
            (0, chai_1.expect)(result.id).to.equal(dataset.id);
            (0, chai_1.expect)(result.kind).to.equal(dataset.kind);
            (0, chai_1.expect)(result.rows).to.have.deep.members(dataset.rows);
        });
        it("should fail when loading a .json file with missing fields", async function () {
            const content = "{\n" +
                '\t"id": "threeCourses",\n' +
                '\t"kind": "sections",\n' +
                '\t"sections": [\n' +
                "\t\t{\n" +
                '\t\t\t"dept": "cpsc",\n' +
                '\t\t\t"id": "410"\n' +
                "\t\t}\n" +
                "\t]\n" +
                "}";
            await fs_extra_1.default.outputFile(DATA_DIR + "/invalid.json", content);
            try {
                await (0, DiskUtil_1.loadDataset)("invalid");
                chai_1.expect.fail("should have threw error for invalid section");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
    });
});
describe("idExists", async function () {
    let facade;
    let smallSection;
    beforeEach(async function () {
        await (0, TestUtil_1.clearDisk)();
        facade = new InsightFacade_1.default();
        smallSection = await (0, TestUtil_1.getContentFromArchives)("validSmall.zip");
    });
    it("should return true if the file exists", async function () {
        await facade.addDataset("sections", smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
        await facade.addDataset("pair", smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
        await facade.addDataset("dataset", smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
        const result = await (0, DiskUtil_2.idExists)("sections");
        (0, chai_1.expect)(result).to.equal(true);
    });
    it("should return false if the file does not exist", async function () {
        await facade.addDataset("sections", smallSection, IInsightFacade_1.InsightDatasetKind.Sections);
        const result = await (0, DiskUtil_2.idExists)("missing");
        (0, chai_1.expect)(result).to.equal(false);
    });
});
//# sourceMappingURL=DiskUtil.spec.js.map