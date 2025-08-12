"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IDataset_1 = __importDefault(require("../IDataset"));
const IInsightFacade_1 = require("../../../controller/IInsightFacade");
const GeneralHelpers_1 = require("../../../util/GeneralHelpers");
class RoomsDataset extends IDataset_1.default {
    id;
    kind;
    constructor(id, kind, rows) {
        super(id, kind, rows);
        this.id = id;
        this.kind = kind;
        if (!(0, GeneralHelpers_1.isValidId)(id)) {
            throw new IInsightFacade_1.InsightError("Dataset: invalid id=" + id);
        }
        if (!this.isValidRooms(rows)) {
            throw new IInsightFacade_1.InsightError("Dataset: invalid rooms");
        }
    }
    isValidRooms(rooms) {
        const requiredFields = [
            "fullname",
            "shortname",
            "number",
            "name",
            "address",
            "lat",
            "lon",
            "seats",
            "type",
            "furniture",
            "href",
        ];
        for (const r of rooms) {
            for (const field of requiredFields) {
                const prefixed = `${this.id}_${field}`;
                if (r[prefixed] === undefined || r[prefixed] === null) {
                    return false;
                }
            }
        }
        return true;
    }
    getRooms() {
        return this.rows;
    }
}
exports.default = RoomsDataset;
//# sourceMappingURL=RoomsDataset.js.map