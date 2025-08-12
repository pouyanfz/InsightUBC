"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const SectionsDataset_1 = __importDefault(require("../../src/model/Dataset/CourseDataset/SectionsDataset"));
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
describe("Dataset", function () {
    it("should throw InsightError for invalid dataset id", () => {
        (0, chai_1.expect)(() => new SectionsDataset_1.default("  ", IInsightFacade_1.InsightDatasetKind.Sections, [])).to.throw(IInsightFacade_1.InsightError);
    });
    it("should throw InsightError if section validation fails", () => {
        const badSections = [{ department: "cpsc" }];
        (0, chai_1.expect)(() => new SectionsDataset_1.default("valid", IInsightFacade_1.InsightDatasetKind.Sections, badSections)).to.throw(IInsightFacade_1.InsightError);
    });
});
//# sourceMappingURL=TestDataset.spec.js.map