import { expect } from "chai";
import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { Log } from "@ubccpsc310/project-support";
import { clearDisk, getContentFromArchives } from "../TestUtil";
import Server from "../../src/rest/Server";

describe("Facade C3", function () {
	let oneBuilding: string;
	let server: Server;
	before(async function () {
		try {
			oneBuilding = await getContentFromArchives("validOneBuilding.zip");
		} catch (err) {
			Log.error(err);
			expect.fail("Failed to get content from archives: " + err);
		}
		const port = 4321;
		server = new Server(port);
		await server.start().catch((err: unknown) => {
			Log.error("Failed to start server: " + err);
			expect.fail("Failed to start server: " + err);
		});
		Log.info("Server started successfully on port " + port);
	});

	after(async function () {
		await server.stop().catch((err: unknown) => {
			Log.error("Failed to stop server: " + err);
			expect.fail("Failed to stop server: " + err);
		});
		Log.info("Server stopped successfully");
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(async function () {
		// might want to add some process logging here to keep track of what is going on
		await clearDisk().catch((err: unknown) => {
			Log.error("Failed to clear disk: " + err);
			expect.fail("Failed to clear disk: " + err);
		});
		Log.info("Disk cleared successfully");
	});

	// Sample on how to format PUT requests
	it("PUT test for courses dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/courses/sections";
		const ZIP_FILE_DATA = Buffer.from(await getContentFromArchives("validSmall.zip"), "base64");

		try {
			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(StatusCodes.OK);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
	it("PUT test for room dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/rooms/rooms";
		const ZIP_FILE_DATA = Buffer.from(oneBuilding, "base64");

		try {
			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");

			expect(res.status).to.equal(StatusCodes.OK);
			expect(res.body).to.have.property("result");
			expect(res.body.result).to.be.an("array");
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("GET test for datasets", async function () {
		await request("http://localhost:4321")
			.put("/dataset/rooms/rooms")
			.send(Buffer.from(oneBuilding, "base64"))
			.set("Content-Type", "application/x-zip-compressed");

		const res = await request("http://localhost:4321").get("/datasets");
		expect(res.status).to.equal(StatusCodes.OK);
		expect(res.body).to.have.property("result");
		expect(res.body.result).to.be.an("array");
		expect(res.body.result[0].id).to.equal("rooms");
		expect(res.body.result.length).to.equal(1);
	});

	it("DELETE test for room dataset", async function () {
		await request("http://localhost:4321")
			.put("/dataset/rooms/rooms")
			.send(Buffer.from(oneBuilding, "base64"))
			.set("Content-Type", "application/x-zip-compressed");

		const res = await request("http://localhost:4321").delete("/dataset/rooms");
		expect(res.status).to.equal(StatusCodes.OK);
		expect(res.body).to.have.property("result");
		expect(res.body.result).to.be.a("string");

		const listRes = await request("http://localhost:4321").get("/datasets");
		expect(listRes.status).to.equal(StatusCodes.OK);
		expect(listRes.body).to.have.property("result");
		const datasetIds = listRes.body.result.map((d: any) => d.id);
		expect(datasetIds).to.not.include("rooms");
	});

	it("PUT should fail with invalid kind", async function () {
		const res = await request("http://localhost:4321")
			.put("/dataset/bad/invalidkind")
			.send(Buffer.from(oneBuilding, "base64"))
			.set("Content-Type", "application/x-zip-compressed");

		expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
		expect(res.body).to.have.property("error");
	});

	it("PUT should fail with invalid dataset ID", async function () {
		const res = await request("http://localhost:4321")
			.put("/dataset/rooms/invalid-id")
			.send(Buffer.from(oneBuilding, "base64"))
			.set("Content-Type", "application/x-zip-compressed");

		expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
		expect(res.body).to.have.property("error");
	});

	it("PUT should fail with empty ZIP file", async function () {
		const res = await request("http://localhost:4321")
			.put("/dataset/empty/rooms")
			.send(Buffer.from(""))
			.set("Content-Type", "application/x-zip-compressed");

		expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
		expect(res.body).to.have.property("error");
	});

	it("DELETE should return 404 for non-existent dataset", async function () {
		const res = await request("http://localhost:4321").delete("/dataset/nothing");
		expect(res.status).to.equal(StatusCodes.NOT_FOUND);
		expect(res.body).to.have.property("error");
	});

	it("start() should fail if called when server is already running", async function () {
		const port = 4322;
		const s = new Server(port);
		await s.start();
		try {
			await s.start();
			expect.fail("Expected start to fail when server already running");
		} catch {
			expect(true).to.be.true; // passed
		}
		await s.stop();
	});

	it("stop() should fail if server was never started", async function () {
		const port = 4322;
		const s = new Server(port);
		try {
			await s.stop();
			expect.fail("Expected stop to fail when server is not started");
		} catch {
			expect(true).to.be.true;
		}
	});

	it("PUT should fail when no zip data is provided", async function () {
		const res = await request("http://localhost:4321")
			.put("/dataset/rooms/rooms")
			.set("Content-Type", "application/x-zip-compressed");

		expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
		expect(res.body).to.have.property("error");
	});

	describe("POST /query", function () {
		it("POST test for a valid query", async function () {
			await request("http://localhost:4321")
				.put("/dataset/rooms/rooms")
				.send(Buffer.from(oneBuilding, "base64"))
				.set("Content-Type", "application/x-zip-compressed");

			const query = {
				WHERE: {},
				OPTIONS: {
					COLUMNS: ["rooms_shortname"],
					ORDER: "rooms_shortname",
				},
			};

			const res = await request("http://localhost:4321")
				.post("/query")
				.send(query)
				.set("Content-Type", "application/json");

			expect(res.status).to.equal(StatusCodes.OK);
			expect(res.body).to.have.property("result");
			expect(res.body.result).to.be.an("array");
		});

		it("POST should fail with invalid query", async function () {
			const query = {
				WHERE: {},
				OPTIONS: {
					COLUMNS: ["nonexistent_field"],
				},
			};

			const res = await request("http://localhost:4321")
				.post("/query")
				.send(query)
				.set("Content-Type", "application/json");

			expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
			expect(res.body).to.have.property("error");
		});

		it("POST should fail if dataset has not been added", async function () {
			const query = {
				WHERE: {},
				OPTIONS: {
					COLUMNS: ["fakeid_shortname"],
				},
			};

			const res = await request("http://localhost:4321")
				.post("/query")
				.send(query)
				.set("Content-Type", "application/json");

			expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
			expect(res.body).to.have.property("error");
		});
	});
});
