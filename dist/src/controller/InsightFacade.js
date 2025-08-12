"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const GeneralHelpers_1 = require("../util/GeneralHelpers");
const DiskUtil_1 = require("../util/DiskUtil");
const DatasetParser_1 = require("../model/Dataset/CourseDataset/DatasetParser");
const QueryValidator_1 = __importDefault(require("../model/Query/QueryValidator"));
const QueryProcessor_1 = require("../model/Query/QueryProcessor");
class InsightFacade {
    datasetCollection;
    rowLimit = 5000;
    constructor() {
        this.datasetCollection = {};
    }
    async addDataset(id, content, kind) {
        if (!(0, GeneralHelpers_1.isValidId)(id)) {
            throw new IInsightFacade_1.InsightError();
        }
        if (await (0, DiskUtil_1.idExists)(id)) {
            throw new IInsightFacade_1.InsightError();
        }
        const dataset = await (0, DatasetParser_1.parseDataset)(id, content, kind);
        if (dataset.numRows === 0) {
            throw new IInsightFacade_1.InsightError("No valid sections found in dataset");
        }
        await (0, DiskUtil_1.saveDataset)(dataset);
        return (0, DiskUtil_1.readIds)();
    }
    async removeDataset(id) {
        if (!(0, GeneralHelpers_1.isValidId)(id)) {
            throw new IInsightFacade_1.InsightError("removeDataset: id given is not valid - id=" + id);
        }
        if (!(await (0, DiskUtil_1.idExists)(id))) {
            throw new IInsightFacade_1.NotFoundError("removeDataset: dataset with id does not exist - id=" + id);
        }
        await (0, DiskUtil_1.deleteDatasetFile)(id);
        return id;
    }
    async performQuery(query) {
        try {
            QueryValidator_1.default.isValidQuery(query);
        }
        catch (error) {
            if (error instanceof IInsightFacade_1.InsightError)
                throw new IInsightFacade_1.InsightError("performQuery: " + error.message);
            else
                throw new Error("performQuery: unexpected error");
        }
        const id = QueryValidator_1.default.extractDatasetId(query);
        if (!id) {
            throw new IInsightFacade_1.InsightError("performQuery: query references multiple dataset ids");
        }
        if (!this.datasetCollection[id]) {
            if (!(await (0, DiskUtil_1.idExists)(id))) {
                throw new IInsightFacade_1.InsightError("performQuery: id=" + id + " does not exist");
            }
            const dataset = await (0, DiskUtil_1.loadDataset)(id);
            if (!dataset) {
                throw new IInsightFacade_1.InsightError("performQuery: dataset is null or unreadable");
            }
            this.datasetCollection[id] = dataset;
        }
        const dataset = this.datasetCollection[id];
        const rows = dataset.rows;
        const whereBoolean = (0, QueryProcessor_1.applyWhere)(query.WHERE, rows);
        let result = rows.filter((item, index) => whereBoolean[index]);
        if ("TRANSFORMATIONS" in query) {
            result = (0, QueryProcessor_1.applyTransformations)(query.TRANSFORMATIONS, result);
        }
        result = (0, QueryProcessor_1.applyOptions)(query.OPTIONS, result);
        if (result.length > this.rowLimit) {
            throw new IInsightFacade_1.ResultTooLargeError("performQuery: Result length > 5000 rows");
        }
        return result;
    }
    async listDatasets() {
        return (0, DiskUtil_1.readDatasetInfo)();
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map