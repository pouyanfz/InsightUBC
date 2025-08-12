"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDataset = saveDataset;
exports.loadDataset = loadDataset;
exports.readDatasetInfo = readDatasetInfo;
exports.deleteDatasetFile = deleteDatasetFile;
exports.readIds = readIds;
exports.idExists = idExists;
const fs_extra_1 = __importDefault(require("fs-extra"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
const SectionsDataset_1 = __importDefault(require("../model/Dataset/CourseDataset/SectionsDataset"));
const RoomsDataset_1 = __importDefault(require("../model//Dataset/RoomDataset/RoomsDataset"));
const DATA_DIR = "data";
const FILE_EXTENSION = ".json";
const METADATA_FILE = `${DATA_DIR}/_listOfDatasets${FILE_EXTENSION}`;
async function saveDataset(dataset) {
    try {
        const filePath = `${DATA_DIR}/${dataset.id}${FILE_EXTENSION}`;
        await fs_extra_1.default.outputFile(filePath, JSON.stringify(dataset.toDiskFormat(), null, 2));
        let metadata = [];
        try {
            metadata = await fs_extra_1.default.readJson(METADATA_FILE);
        }
        catch {
            metadata = [];
        }
        metadata = metadata.filter((d) => d.id !== dataset.id);
        metadata.push({
            id: dataset.id,
            kind: dataset.kind,
            numRows: dataset.numRows,
        });
        await fs_extra_1.default.outputFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
    }
    catch {
        throw new IInsightFacade_1.InsightError("saveDataset: unable to write file");
    }
}
async function loadDataset(id) {
    try {
        const file = await fs_extra_1.default.readFile(`${DATA_DIR}/${id}${FILE_EXTENSION}`, "utf-8");
        const object = JSON.parse(file);
        if (!("id" in object) || !("kind" in object) || !("rows" in object)) {
            throw new IInsightFacade_1.InsightError("loadDataset: json file is missing fields");
        }
        if (object.kind === "sections") {
            return new SectionsDataset_1.default(object.id, object.kind, object.rows);
        }
        else if (object.kind === "rooms") {
            return new RoomsDataset_1.default(object.id, object.kind, object.rows);
        }
        else {
            throw new IInsightFacade_1.InsightError("loadDataset: unknown dataset kind");
        }
    }
    catch {
        throw new IInsightFacade_1.InsightError("loadDataset: couldn't read or parse file");
    }
}
async function readDatasetInfo() {
    try {
        return await fs_extra_1.default.readJson(METADATA_FILE);
    }
    catch {
        return [];
    }
}
async function deleteDatasetFile(id) {
    try {
        await fs_extra_1.default.remove(`${DATA_DIR}/${id}${FILE_EXTENSION}`);
        let metadata = await readDatasetInfo();
        metadata = metadata.filter((d) => d.id !== id);
        await fs_extra_1.default.outputFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
    }
    catch {
        throw new IInsightFacade_1.InsightError("File not found");
    }
}
async function readIds() {
    const info = await readDatasetInfo();
    return info.map((d) => d.id);
}
async function idExists(id) {
    const ids = await readIds();
    return ids.includes(id);
}
//# sourceMappingURL=DiskUtil.js.map