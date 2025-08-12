import { expect } from "chai";
import SectionsDataset from "../../src/model/Dataset/CourseDataset/SectionsDataset";
import { InsightError, InsightDatasetKind } from "../../src/controller/IInsightFacade";

describe("Dataset", function () {
	it("should throw InsightError for invalid dataset id", () => {
		expect(() => new SectionsDataset("  ", InsightDatasetKind.Sections, [])).to.throw(InsightError);
	});

	it("should throw InsightError if section validation fails", () => {
		const badSections = [{ department: "cpsc" }] as any[];
		expect(() => new SectionsDataset("valid", InsightDatasetKind.Sections, badSections)).to.throw(InsightError);
	});
});
