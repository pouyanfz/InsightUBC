"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const jszip_1 = __importDefault(require("jszip"));
const RoomDatasetParser_1 = __importDefault(require("../../src/model/Dataset/RoomDataset/RoomDatasetParser"));
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const TestUtil_1 = require("../TestUtil");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
describe("RoomDatasetParser", () => {
    let campus;
    let originalFetchGeo;
    before(async () => {
        campus = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        originalFetchGeo = RoomDatasetParser_1.default.fetchGeo;
    });
    beforeEach(() => {
        RoomDatasetParser_1.default.fetchGeo = async () => ({ lat: 0, lon: 0 });
    });
    afterEach(() => {
        RoomDatasetParser_1.default.fetchGeo = originalFetchGeo;
    });
    const validateRoomFields = (room) => {
        (0, chai_1.expect)(room).to.have.all.keys([
            "campus_fullname",
            "campus_shortname",
            "campus_number",
            "campus_name",
            "campus_address",
            "campus_lat",
            "campus_lon",
            "campus_seats",
            "campus_type",
            "campus_furniture",
            "campus_href",
        ]);
    };
    it("parses campus.zip into valid rooms", async () => {
        const dataset = await RoomDatasetParser_1.default.parse(campus, "campus");
        (0, chai_1.expect)(dataset.rows).to.be.an("array").with.length.greaterThan(0);
        validateRoomFields(dataset.rows[0]);
    });
    it("validates all room fields in parsed dataset", async () => {
        const dataset = await RoomDatasetParser_1.default.parse(campus, "campus");
        dataset.rows.forEach(validateRoomFields);
    });
    it("contains expected number of rooms", async () => {
        const EXPECTED_ROOM_COUNT = 364;
        const dataset = await RoomDatasetParser_1.default.parse(campus, "campus");
        (0, chai_1.expect)(dataset.rows.length).to.equal(EXPECTED_ROOM_COUNT);
    });
    it("throws InsightError if index.htm is missing", async () => {
        const zip = new jszip_1.default();
        const content = await zip.generateAsync({ type: "base64" });
        await (0, chai_1.expect)(RoomDatasetParser_1.default.parse(content, "campus")).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("throws InsightError if no valid rooms are found", async () => {
        const zip = new jszip_1.default();
        zip.file("index.htm", `<table><tr class='row'>
				<td class='views-field-title'><a href='./fake.htm'>Fake</a></td>
				<td class='views-field-field-building-code'>FB</td>
				<td class='views-field-field-building-address'>123 Nowhere</td>
			</tr></table>`);
        zip.file("fake.htm", `<table></table>`);
        const content = await zip.generateAsync({ type: "base64" });
        await (0, chai_1.expect)(RoomDatasetParser_1.default.parse(content, "campus")).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("throws InsightError for invalid zip format", async () => {
        await (0, chai_1.expect)(RoomDatasetParser_1.default.parse("invalid zip", "campus")).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
});
describe("InsightFacade with campus dataset", () => {
    let facade;
    beforeEach(async () => {
        await (0, TestUtil_1.clearDisk)();
        facade = new InsightFacade_1.default();
    });
    it("adds campus dataset successfully", async () => {
        const campus = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        const result = await facade.addDataset("campus", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
        (0, chai_1.expect)(result).to.deep.equal(["campus"]);
    });
    it("retrieves campus dataset", async () => {
        const campus = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        await facade.addDataset("campus", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
        const datasets = await facade.listDatasets();
        (0, chai_1.expect)(datasets).to.have.lengthOf(1);
        (0, chai_1.expect)(datasets[0].id).to.equal("campus");
        (0, chai_1.expect)(datasets[0].kind).to.equal(IInsightFacade_1.InsightDatasetKind.Rooms);
    });
});
describe("RoomDatasetParser.fetchGeo (real requests)", () => {
    it("returns correct geo for known address", async () => {
        const result = await RoomDatasetParser_1.default.fetchGeo("2366 Main Mall");
        (0, chai_1.expect)(result).to.deep.equal({ lat: 49.26118, lon: -123.2488 });
    });
    it("rejects invalid geo address", async () => {
        await (0, chai_1.expect)(RoomDatasetParser_1.default.fetchGeo("123 Fake St")).to.be.rejected;
    });
});
describe("RoomDatasetParser internal parseBuildingRooms", () => {
    it("returns room list for valid building and room HTML", async () => {
        const zip = new jszip_1.default();
        const b = {
            fullname: "Test Building",
            shortname: "TB",
            address: "123 Test St",
            href: "./test.htm",
        };
        zip.file("test.htm", `<table>
				<tr class='views-field-field-room-number'>
					<td class='views-field-field-room-number'><a href="room1.htm">101</a></td>
					<td class='views-field-field-room-capacity'>50</td>
					<td class='views-field-field-room-type'>Lecture</td>
					<td class='views-field-field-room-furniture'>Chairs</td>
				</tr>
			</table>`);
        const originalFetchGeo = RoomDatasetParser_1.default.fetchGeo;
        RoomDatasetParser_1.default.fetchGeo = async () => ({
            lat: 149,
            lon: -123,
        });
        const zipContent = await zip.generateAsync({ type: "base64" });
        const zipLoaded = await jszip_1.default.loadAsync(zipContent, { base64: true });
        const result = await RoomDatasetParser_1.default.parseBuildingRooms(zipLoaded, b);
        (0, chai_1.expect)(result).to.be.an("array").with.lengthOf(1);
        (0, chai_1.expect)(result[0]).to.include({
            fullname: "Test Building",
            shortname: "TB",
            number: "101",
            name: "TB_101",
            address: "123 Test St",
            seats: 50,
            type: "Lecture",
            furniture: "Chairs",
            href: "room1.htm",
        });
        RoomDatasetParser_1.default.fetchGeo = originalFetchGeo;
    });
});
//# sourceMappingURL=TestRoomDatasetParser.spec.js.map