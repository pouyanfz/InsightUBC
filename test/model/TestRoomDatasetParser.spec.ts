import { expect } from "chai";
import JSZip from "jszip";
import RoomDatasetParser from "../../src/model/Dataset/RoomDataset/RoomDatasetParser";
import { InsightDatasetKind, InsightError } from "../../src/controller/IInsightFacade";
import { clearDisk, getContentFromArchives } from "../TestUtil";
import InsightFacade from "../../src/controller/InsightFacade";

describe("RoomDatasetParser", () => {
	let campus: string;
	let originalFetchGeo: any;

	before(async () => {
		campus = await getContentFromArchives("campus.zip");
		originalFetchGeo = (RoomDatasetParser as any).fetchGeo;
	});

	beforeEach(() => {
		(RoomDatasetParser as any).fetchGeo = async (): Promise<{ lat: number; lon: number }> => ({ lat: 0, lon: 0 });
	});

	afterEach(() => {
		(RoomDatasetParser as any).fetchGeo = originalFetchGeo;
	});

	const validateRoomFields = (room: any): void => {
		expect(room).to.have.all.keys([
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
		const dataset = await RoomDatasetParser.parse(campus, "campus");
		expect(dataset.rows).to.be.an("array").with.length.greaterThan(0);
		validateRoomFields(dataset.rows[0]);
	});

	it("validates all room fields in parsed dataset", async () => {
		const dataset = await RoomDatasetParser.parse(campus, "campus");
		dataset.rows.forEach(validateRoomFields);
	});

	it("contains expected number of rooms", async () => {
		const EXPECTED_ROOM_COUNT = 364;
		const dataset = await RoomDatasetParser.parse(campus, "campus");
		expect(dataset.rows.length).to.equal(EXPECTED_ROOM_COUNT);
	});

	it("throws InsightError if index.htm is missing", async () => {
		const zip = new JSZip();
		const content = await zip.generateAsync({ type: "base64" });
		await expect(RoomDatasetParser.parse(content, "campus")).to.be.rejectedWith(InsightError);
	});

	it("throws InsightError if no valid rooms are found", async () => {
		const zip = new JSZip();
		zip.file(
			"index.htm",
			`<table><tr class='row'>
				<td class='views-field-title'><a href='./fake.htm'>Fake</a></td>
				<td class='views-field-field-building-code'>FB</td>
				<td class='views-field-field-building-address'>123 Nowhere</td>
			</tr></table>`
		);
		zip.file("fake.htm", `<table></table>`);
		const content = await zip.generateAsync({ type: "base64" });
		await expect(RoomDatasetParser.parse(content, "campus")).to.be.rejectedWith(InsightError);
	});

	it("throws InsightError for invalid zip format", async () => {
		await expect(RoomDatasetParser.parse("invalid zip", "campus")).to.be.rejectedWith(InsightError);
	});
});

describe("InsightFacade with campus dataset", () => {
	let facade: InsightFacade;

	beforeEach(async () => {
		await clearDisk();
		facade = new InsightFacade();
	});

	it("adds campus dataset successfully", async () => {
		const campus = await getContentFromArchives("campus.zip");
		const result = await facade.addDataset("campus", campus, InsightDatasetKind.Rooms);
		expect(result).to.deep.equal(["campus"]);
	});

	it("retrieves campus dataset", async () => {
		const campus = await getContentFromArchives("campus.zip");
		await facade.addDataset("campus", campus, InsightDatasetKind.Rooms);
		const datasets = await facade.listDatasets();
		expect(datasets).to.have.lengthOf(1);
		expect(datasets[0].id).to.equal("campus");
		expect(datasets[0].kind).to.equal(InsightDatasetKind.Rooms);
	});
});

describe("RoomDatasetParser.fetchGeo (real requests)", () => {
	it("returns correct geo for known address", async () => {
		const result = await (RoomDatasetParser as any).fetchGeo("2366 Main Mall");
		expect(result).to.deep.equal({ lat: 49.26118, lon: -123.2488 });
	});

	it("rejects invalid geo address", async () => {
		await expect((RoomDatasetParser as any).fetchGeo("123 Fake St")).to.be.rejected;
	});
});

describe("RoomDatasetParser internal parseBuildingRooms", () => {
	it("returns room list for valid building and room HTML", async (): Promise<void> => {
		const zip = new JSZip();
		const b = {
			fullname: "Test Building",
			shortname: "TB",
			address: "123 Test St",
			href: "./test.htm",
		};

		zip.file(
			"test.htm",
			`<table>
				<tr class='views-field-field-room-number'>
					<td class='views-field-field-room-number'><a href="room1.htm">101</a></td>
					<td class='views-field-field-room-capacity'>50</td>
					<td class='views-field-field-room-type'>Lecture</td>
					<td class='views-field-field-room-furniture'>Chairs</td>
				</tr>
			</table>`
		);

		const originalFetchGeo = (RoomDatasetParser as any).fetchGeo;
		(RoomDatasetParser as any).fetchGeo = async (): Promise<{ lat: number; lon: number }> => ({
			lat: 149,
			lon: -123,
		});

		const zipContent: string = await zip.generateAsync({ type: "base64" });
		const zipLoaded: JSZip = await JSZip.loadAsync(zipContent, { base64: true });
		const result: any[] = await (RoomDatasetParser as any).parseBuildingRooms(zipLoaded, b);

		expect(result).to.be.an("array").with.lengthOf(1);
		expect(result[0]).to.include({
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

		(RoomDatasetParser as any).fetchGeo = originalFetchGeo;
	});
});
