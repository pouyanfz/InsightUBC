"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDataset = parseDataset;
const jszip_1 = __importDefault(require("jszip"));
const IInsightFacade_1 = require("../../../controller/IInsightFacade");
const SectionsDataset_1 = __importDefault(require("./SectionsDataset"));
const RoomDatasetParser_1 = __importDefault(require("../RoomDataset/RoomDatasetParser"));
const mfields = {
    avg: "Avg",
    pass: "Pass",
    fail: "Fail",
    audit: "Audit",
    year: "Year",
};
const sfields = {
    dept: "Subject",
    id: "Course",
    instructor: "Professor",
    title: "Title",
    uuid: "id",
};
const SECTION_OVERALL_YEAR = 1900;
const requiredFields = Object.values(mfields).concat(Object.values(sfields));
async function parseDataset(id, content, kind) {
    if (kind === IInsightFacade_1.InsightDatasetKind.Sections) {
        const files = await getCourseFiles(content);
        const fileContents = await Promise.all(files.map(readFileAsString));
        const sections = extractValidSections(id, fileContents);
        if (sections.length === 0) {
            throw new IInsightFacade_1.InsightError("No valid sections found");
        }
        return new SectionsDataset_1.default(id, kind, sections);
    }
    else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
        const roomsDataset = await RoomDatasetParser_1.default.parse(content, id);
        if (roomsDataset.getRooms().length === 0) {
            throw new IInsightFacade_1.InsightError("No valid rooms found");
        }
        return roomsDataset;
    }
    else {
        throw new IInsightFacade_1.InsightError("Unsupported dataset kind");
    }
}
async function getCourseFiles(content) {
    let zipped;
    try {
        zipped = await jszip_1.default.loadAsync(content, { base64: true });
    }
    catch {
        throw new IInsightFacade_1.InsightError("Invalid ZIP content");
    }
    const files = Object.values(zipped.files).filter(function (file) {
        return file.name.startsWith("courses/") && !file.dir;
    });
    if (files.length === 0) {
        throw new IInsightFacade_1.InsightError("Missing or empty 'courses/' folder");
    }
    return files;
}
async function readFileAsString(file) {
    return file.async("string");
}
function createSection(id, section) {
    if (!section || typeof section !== "object") {
        return null;
    }
    for (const field of requiredFields) {
        if (!(field in section)) {
            return null;
        }
    }
    try {
        const item = {};
        for (const mfield of Object.keys(mfields)) {
            const jsonKey = mfields[mfield];
            const value = Number(section[jsonKey]);
            if (isNaN(value)) {
                return null;
            }
            if (mfield === "year" && section.Section === "overall") {
                item[id + "_" + mfield] = SECTION_OVERALL_YEAR;
            }
            else {
                item[id + "_" + mfield] = Number(section[jsonKey]);
            }
        }
        for (const sfield of Object.keys(sfields)) {
            const jsonKey = sfields[sfield];
            item[id + "_" + sfield] = String(section[jsonKey]).trim();
        }
        return item;
    }
    catch {
        return null;
    }
}
function extractValidSections(id, contents) {
    const sections = [];
    for (const raw of contents) {
        try {
            const json = JSON.parse(raw);
            if (Array.isArray(json.result)) {
                for (const entry of json.result) {
                    const section = createSection(id, entry);
                    if (section) {
                        sections.push(section);
                    }
                }
            }
        }
        catch {
            continue;
        }
    }
    return sections;
}
//# sourceMappingURL=DatasetParser.js.map