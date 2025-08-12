"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const HTMLRoomParser_1 = __importDefault(require("../../src/model/Dataset/RoomDataset/HTMLRoomParser"));
const jszip_1 = __importDefault(require("jszip"));
const TestUtil_1 = require("../TestUtil");
describe("HTMLRoomParser", () => {
    const sampleIndexHtml = `
    <table>
      <tr class="row">
        <td class="views-field-title"><a href="./building1.htm">Building One</a></td>
        <td class="views-field-field-building-code">B1</td>
        <td class="views-field-field-building-address">123 Main St</td>
      </tr>
    </table>
  `;
    const sampleBuildingHtml = `
    <table>
      <tr class="views-field-field-room-number">
        <td class="views-field-field-room-number"><a href="room101.htm">101</a></td>
        <td class="views-field-field-room-capacity">50</td>
        <td class="views-field-field-room-type">Lecture Hall</td>
        <td class="views-field-field-room-furniture">Fixed Tables</td>
      </tr>
    </table>
  `;
    it("extractBuildings parses buildings from index HTML", () => {
        const buildings = HTMLRoomParser_1.default.extractBuildings(sampleIndexHtml);
        (0, chai_1.expect)(buildings.length).to.equal(1);
        (0, chai_1.expect)(buildings[0]).to.deep.equal({
            fullname: "Building One",
            href: "./building1.htm",
            shortname: "B1",
            address: "123 Main St",
        });
    });
    it("extractRooms parses rooms correctly (raw room data only)", () => {
        const rooms = HTMLRoomParser_1.default.extractRooms(sampleBuildingHtml);
        (0, chai_1.expect)(rooms.length).to.equal(1);
        (0, chai_1.expect)(rooms[0]).to.deep.equal({
            number: "101",
            seats: "50",
            type: "Lecture Hall",
            furniture: "Fixed Tables",
            href: "room101.htm",
        });
    });
    it("should include CS buildings from campus.zip index.htm", async () => {
        const content = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        const zip = await jszip_1.default.loadAsync(content, { base64: true });
        const indexFile = zip.file("index.htm");
        (0, chai_1.expect)(indexFile).to.not.be.null;
        if (!indexFile) {
            throw new Error("index.htm not found in zip archive");
        }
        const indexHtml = await indexFile.async("string");
        const buildings = HTMLRoomParser_1.default.extractBuildings(indexHtml);
        const knownBuilding = buildings.find((b) => b.shortname === "ICCS");
        (0, chai_1.expect)(knownBuilding).to.exist;
        (0, chai_1.expect)(knownBuilding).to.include.all.keys("fullname", "address", "href", "shortname");
        (0, chai_1.expect)(knownBuilding?.fullname).to.equal("Institute for Computing (ICICS/CS)");
        (0, chai_1.expect)(knownBuilding?.address).to.equal("2366 Main Mall");
        (0, chai_1.expect)(knownBuilding?.href).to.equal("./campus/discover/buildings-and-classrooms/ICCS.htm");
        (0, chai_1.expect)(knownBuilding?.shortname).to.equal("ICCS");
    });
    it("should extract all expected buildings from campus.zip index.htm", async () => {
        const content = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        const zip = await jszip_1.default.loadAsync(content, { base64: true });
        const expected = [
            "ACU",
            "ALRD",
            "ANSO",
            "AERL",
            "ACEN",
            "AAC",
            "AUDI",
            "AUDX",
            "BINN",
            "BIOL",
            "BRKX",
            "BUCH",
            "BUTO",
            "CHOI",
            "CIRS",
            "CHAN",
            "CHBE",
            "CHEM",
            "CEME",
            "COPP",
            "DLAM",
            "HSCC",
            "DSOM",
            "KENN",
            "EOSM",
            "ESB",
            "FNH",
            "FSC",
            "FORW",
            "KAIS",
            "LASR",
            "FRWO",
            "FRDM",
            "GEOG",
            "CUNN",
            "HEBB",
            "HENN",
            "ANGU",
            "GREN",
            "DMP",
            "ICCS",
            "IONA",
            "IBLC",
            "MCDN",
            "SOWK",
            "LSK",
            "LSC",
            "MCLD",
            "MCML",
            "MATH",
            "MATX",
            "MEDC",
            "MSB",
            "MUSC",
            "SCRF",
            "ORCH",
            "PHRM",
            "PONE",
            "PCOH",
            "PONF",
            "PONH",
            "OSBO",
            "SPPH",
            "SOJ",
            "SRC",
            "UCLL",
            "TFPB",
            "TFPX",
            "MGYM",
            "EDC",
            "WESB",
            "WMAX",
            "SWNG",
            "WOOD",
        ];
        const indexFile = zip.file("index.htm");
        (0, chai_1.expect)(indexFile).to.not.be.null;
        if (!indexFile) {
            throw new Error("index.htm not found in zip archive");
        }
        const indexHtml = await indexFile.async("string");
        const buildings = HTMLRoomParser_1.default.extractBuildings(indexHtml);
        const foundShortnames = buildings
            .map((b) => b.shortname)
            .filter((name) => typeof name === "string" && name.length > 0);
        const missingBuildings = expected.filter((name) => !foundShortnames.includes(name));
        const extraBuildings = foundShortnames.filter((name) => !expected.includes(name));
        (0, chai_1.expect)(buildings.length).to.equal(expected.length);
        (0, chai_1.expect)(missingBuildings).to.be.empty;
        (0, chai_1.expect)(extraBuildings).to.be.empty;
    });
    it("should reject invalid index.htm structure", async () => {
        const zip = new jszip_1.default();
        zip.file("index.htm", "<html><body>No buildings here</body></html>");
        const content = await zip.generateAsync({ type: "base64" });
        const result = HTMLRoomParser_1.default.extractBuildings(content);
        (0, chai_1.expect)(result).to.be.an("array").that.is.empty;
    });
    it("should reject missing index.htm", async () => {
        const zip = new jszip_1.default();
        const content = await zip.generateAsync({ type: "base64" });
        const result = HTMLRoomParser_1.default.extractBuildings(content);
        (0, chai_1.expect)(result).to.be.an("array").that.is.empty;
    });
    it("returns empty list when index HTML is empty", () => {
        const buildings = HTMLRoomParser_1.default.extractBuildings("");
        (0, chai_1.expect)(buildings).to.be.an("array").that.is.empty;
    });
    it("handles malformed building rows gracefully", () => {
        const malformed = `<table><tr class="row"><td>No proper structure</td></tr></table>`;
        const buildings = HTMLRoomParser_1.default.extractBuildings(malformed);
        (0, chai_1.expect)(buildings).to.be.an("array").that.is.empty;
    });
    it("returns empty list when building HTML is empty", () => {
        const rooms = HTMLRoomParser_1.default.extractRooms("");
        (0, chai_1.expect)(rooms).to.be.an("array").that.is.empty;
    });
    it("skips room entries with missing fields", () => {
        const partial = `
    <table>
      <tr class="views-field-field-room-number">
        <td class="views-field-field-room-number">201</td>
        <!-- capacity missing -->
        <td class="views-field-field-room-type">Seminar</td>
        <td class="views-field-field-room-furniture">Moveable Chairs</td>
      </tr>
    </table>`;
        const rooms = HTMLRoomParser_1.default.extractRooms(partial);
        (0, chai_1.expect)(rooms).to.be.an("array").that.is.empty;
    });
    it("extracts multiple buildings", () => {
        const html = `
    <table>
      <tr class="row">
        <td class="views-field-title"><a href="./a.htm">A</a></td>
        <td class="views-field-field-building-code">A</td>
        <td class="views-field-field-building-address">Addr A</td>
      </tr>
      <tr class="row">
        <td class="views-field-title"><a href="./b.htm">B</a></td>
        <td class="views-field-field-building-code">B</td>
        <td class="views-field-field-building-address">Addr B</td>
      </tr>
    </table>`;
        const buildings = HTMLRoomParser_1.default.extractBuildings(html);
        (0, chai_1.expect)(buildings.length).to.equal(2);
    });
    it("extracts duplicate building entries if present", () => {
        const html = `
	<table>
	<tr class="row">
	  <td class="views-field-title"><a href="./dup.htm">Dup</a></td>
	  <td class="views-field-field-building-code">DUP</td>
	  <td class="views-field-field-building-address">123 Dup</td>
	</tr>
	<tr class="row">
	  <td class="views-field-title"><a href="./dup.htm">Dup</a></td>
	  <td class="views-field-field-building-code">DUP</td>
	  <td class="views-field-field-building-address">123 Dup</td>
	</tr>
	</table>`;
        const buildings = HTMLRoomParser_1.default.extractBuildings(html);
        (0, chai_1.expect)(buildings).to.have.lengthOf(2);
    });
});
//# sourceMappingURL=TestHTMLRoomParser.spec.js.map