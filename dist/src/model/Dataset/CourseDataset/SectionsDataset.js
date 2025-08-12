"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IDataset_1 = __importDefault(require("../IDataset"));
const IInsightFacade_1 = require("../../../controller/IInsightFacade");
const GeneralHelpers_1 = require("../../../util/GeneralHelpers");
const mfields = ["avg", "pass", "fail", "audit", "year"];
const sfields = ["dept", "id", "instructor", "title", "uuid"];
class SectionsDataset extends IDataset_1.default {
    id;
    kind;
    constructor(id, kind, rows) {
        super(id, kind, rows);
        this.id = id;
        this.kind = kind;
        if (!(0, GeneralHelpers_1.isValidId)(id)) {
            throw new IInsightFacade_1.InsightError("Dataset: invalid id=" + id);
        }
        if (!this.isValidSections(rows)) {
            throw new IInsightFacade_1.InsightError("Dataset: invalid sections");
        }
    }
    isValidSections(sections) {
        const requiredFields = mfields.concat(sfields).map((item) => this.id + "_" + item);
        for (const s of sections) {
            for (const field of requiredFields) {
                if (!(field in s)) {
                    return false;
                }
            }
        }
        return true;
    }
}
exports.default = SectionsDataset;
//# sourceMappingURL=SectionsDataset.js.map