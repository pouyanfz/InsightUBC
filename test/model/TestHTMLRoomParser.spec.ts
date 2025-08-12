import { expect } from "chai";
import HTMLRoomParser from "../../src/model/Dataset/RoomDataset/HTMLRoomParser";
import JSZip from "jszip";
import { getContentFromArchives } from "../TestUtil";

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
		const buildings = HTMLRoomParser.extractBuildings(sampleIndexHtml);
		expect(buildings.length).to.equal(1);
		expect(buildings[0]).to.deep.equal({
			fullname: "Building One",
			href: "./building1.htm",
			shortname: "B1",
			address: "123 Main St",
		});
	});

	it("extractRooms parses rooms correctly (raw room data only)", () => {
		const rooms = HTMLRoomParser.extractRooms(sampleBuildingHtml);

		expect(rooms.length).to.equal(1);
		expect(rooms[0]).to.deep.equal({
			number: "101",
			seats: "50",
			type: "Lecture Hall",
			furniture: "Fixed Tables",
			href: "room101.htm",
		});
	});

	it("should include CS buildings from campus.zip index.htm", async () => {
		const content = await getContentFromArchives("campus.zip");
		const zip = await JSZip.loadAsync(content, { base64: true });

		const indexFile = zip.file("index.htm");
		expect(indexFile).to.not.be.null;

		if (!indexFile) {
			throw new Error("index.htm not found in zip archive");
		}

		const indexHtml = await indexFile.async("string");
		const buildings = HTMLRoomParser.extractBuildings(indexHtml);

		const knownBuilding = buildings.find((b) => b.shortname === "ICCS");
		expect(knownBuilding).to.exist;
		expect(knownBuilding).to.include.all.keys("fullname", "address", "href", "shortname");
		expect(knownBuilding?.fullname).to.equal("Institute for Computing (ICICS/CS)");
		expect(knownBuilding?.address).to.equal("2366 Main Mall");
		expect(knownBuilding?.href).to.equal("./campus/discover/buildings-and-classrooms/ICCS.htm");
		expect(knownBuilding?.shortname).to.equal("ICCS");
	});

	it("should extract all expected buildings from campus.zip index.htm", async () => {
		const content = await getContentFromArchives("campus.zip");
		const zip = await JSZip.loadAsync(content, { base64: true });

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
		expect(indexFile).to.not.be.null;

		if (!indexFile) {
			throw new Error("index.htm not found in zip archive");
		}

		const indexHtml = await indexFile.async("string");
		const buildings = HTMLRoomParser.extractBuildings(indexHtml);

		const foundShortnames = buildings
			.map((b) => b.shortname)
			.filter((name): name is string => typeof name === "string" && name.length > 0);

		// console.log("Found buildings:", foundShortnames);

		const missingBuildings = expected.filter((name) => !foundShortnames.includes(name));
		const extraBuildings = foundShortnames.filter((name) => !expected.includes(name));

		expect(buildings.length).to.equal(expected.length);
		expect(missingBuildings).to.be.empty;
		expect(extraBuildings).to.be.empty;
	});

	it("should reject invalid index.htm structure", async () => {
		const zip = new JSZip();
		zip.file("index.htm", "<html><body>No buildings here</body></html>");
		const content = await zip.generateAsync({ type: "base64" });

		const result = HTMLRoomParser.extractBuildings(content);
		expect(result).to.be.an("array").that.is.empty;
	});
	it("should reject missing index.htm", async () => {
		const zip = new JSZip();
		const content = await zip.generateAsync({ type: "base64" });

		const result = HTMLRoomParser.extractBuildings(content);
		expect(result).to.be.an("array").that.is.empty;
	});

	it("returns empty list when index HTML is empty", () => {
		const buildings = HTMLRoomParser.extractBuildings("");
		expect(buildings).to.be.an("array").that.is.empty;
	});

	it("handles malformed building rows gracefully", () => {
		const malformed = `<table><tr class="row"><td>No proper structure</td></tr></table>`;
		const buildings = HTMLRoomParser.extractBuildings(malformed);
		expect(buildings).to.be.an("array").that.is.empty;
	});
	it("returns empty list when building HTML is empty", () => {
		const rooms = HTMLRoomParser.extractRooms("");
		expect(rooms).to.be.an("array").that.is.empty;
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
		const rooms = HTMLRoomParser.extractRooms(partial);
		expect(rooms).to.be.an("array").that.is.empty;
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
		const buildings = HTMLRoomParser.extractBuildings(html);
		expect(buildings.length).to.equal(2);
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
		const buildings = HTMLRoomParser.extractBuildings(html);
		expect(buildings).to.have.lengthOf(2);
	});
});
