"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const http_status_codes_1 = require("http-status-codes");
const project_support_1 = require("@ubccpsc310/project-support");
const TestUtil_1 = require("../TestUtil");
const Server_1 = __importDefault(require("../../src/rest/Server"));
describe("Facade C3", function () {
    let oneBuilding;
    let server;
    before(async function () {
        try {
            oneBuilding = await (0, TestUtil_1.getContentFromArchives)("validOneBuilding.zip");
        }
        catch (err) {
            project_support_1.Log.error(err);
            chai_1.expect.fail("Failed to get content from archives: " + err);
        }
        const port = 4321;
        server = new Server_1.default(port);
        await server.start().catch((err) => {
            project_support_1.Log.error("Failed to start server: " + err);
            chai_1.expect.fail("Failed to start server: " + err);
        });
        project_support_1.Log.info("Server started successfully on port " + port);
    });
    after(async function () {
        await server.stop().catch((err) => {
            project_support_1.Log.error("Failed to stop server: " + err);
            chai_1.expect.fail("Failed to stop server: " + err);
        });
        project_support_1.Log.info("Server stopped successfully");
    });
    beforeEach(function () {
    });
    afterEach(async function () {
        await (0, TestUtil_1.clearDisk)().catch((err) => {
            project_support_1.Log.error("Failed to clear disk: " + err);
            chai_1.expect.fail("Failed to clear disk: " + err);
        });
        project_support_1.Log.info("Disk cleared successfully");
    });
    it("PUT test for courses dataset", async function () {
        const SERVER_URL = "TBD";
        const ENDPOINT_URL = "TBD";
        const ZIP_FILE_DATA = "TBD";
        try {
            const res = await (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed");
            (0, chai_1.expect)(res.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
        }
        catch (err) {
            project_support_1.Log.error(err);
            chai_1.expect.fail();
        }
    });
    it("PUT test for room dataset", async function () {
        const SERVER_URL = "http://localhost:4321";
        const ENDPOINT_URL = "/dataset/rooms/rooms";
        const ZIP_FILE_DATA = Buffer.from(oneBuilding, "base64");
        try {
            const res = await (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed");
            (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.OK);
            (0, chai_1.expect)(res.body).to.have.property("result");
            (0, chai_1.expect)(res.body.result).to.be.an("array");
        }
        catch (err) {
            project_support_1.Log.error(err);
            chai_1.expect.fail();
        }
    });
    it("GET test for datasets", async function () {
        await (0, supertest_1.default)("http://localhost:4321")
            .put("/dataset/rooms/rooms")
            .send(Buffer.from(oneBuilding, "base64"))
            .set("Content-Type", "application/x-zip-compressed");
        const res = await (0, supertest_1.default)("http://localhost:4321").get("/datasets");
        (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.OK);
        (0, chai_1.expect)(res.body).to.have.property("result");
        (0, chai_1.expect)(res.body.result).to.be.an("array");
        (0, chai_1.expect)(res.body.result[0].id).to.equal("rooms");
        (0, chai_1.expect)(res.body.result.length).to.equal(1);
    });
    it("DELETE test for room dataset", async function () {
        await (0, supertest_1.default)("http://localhost:4321")
            .put("/dataset/rooms/rooms")
            .send(Buffer.from(oneBuilding, "base64"))
            .set("Content-Type", "application/x-zip-compressed");
        const res = await (0, supertest_1.default)("http://localhost:4321").delete("/dataset/rooms");
        (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.OK);
        (0, chai_1.expect)(res.body).to.have.property("result");
        (0, chai_1.expect)(res.body.result).to.be.a("string");
        const listRes = await (0, supertest_1.default)("http://localhost:4321").get("/datasets");
        (0, chai_1.expect)(listRes.status).to.equal(http_status_codes_1.StatusCodes.OK);
        (0, chai_1.expect)(listRes.body).to.have.property("result");
        const datasetIds = listRes.body.result.map((d) => d.id);
        (0, chai_1.expect)(datasetIds).to.not.include("rooms");
    });
    it("PUT should fail with invalid kind", async function () {
        const res = await (0, supertest_1.default)("http://localhost:4321")
            .put("/dataset/bad/invalidkind")
            .send(Buffer.from(oneBuilding, "base64"))
            .set("Content-Type", "application/x-zip-compressed");
        (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.BAD_REQUEST);
        (0, chai_1.expect)(res.body).to.have.property("error");
    });
    it("PUT should fail with invalid dataset ID", async function () {
        const res = await (0, supertest_1.default)("http://localhost:4321")
            .put("/dataset/rooms/invalid-id")
            .send(Buffer.from(oneBuilding, "base64"))
            .set("Content-Type", "application/x-zip-compressed");
        (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.BAD_REQUEST);
        (0, chai_1.expect)(res.body).to.have.property("error");
    });
    it("PUT should fail with empty ZIP file", async function () {
        const res = await (0, supertest_1.default)("http://localhost:4321")
            .put("/dataset/empty/rooms")
            .send(Buffer.from(""))
            .set("Content-Type", "application/x-zip-compressed");
        (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.BAD_REQUEST);
        (0, chai_1.expect)(res.body).to.have.property("error");
    });
    it("DELETE should return 404 for non-existent dataset", async function () {
        const res = await (0, supertest_1.default)("http://localhost:4321").delete("/dataset/nothing");
        (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.NOT_FOUND);
        (0, chai_1.expect)(res.body).to.have.property("error");
    });
    it("start() should fail if called when server is already running", async function () {
        const port = 4322;
        const s = new Server_1.default(port);
        await s.start();
        try {
            await s.start();
            chai_1.expect.fail("Expected start to fail when server already running");
        }
        catch {
            (0, chai_1.expect)(true).to.be.true;
        }
        await s.stop();
    });
    it("stop() should fail if server was never started", async function () {
        const port = 4322;
        const s = new Server_1.default(port);
        try {
            await s.stop();
            chai_1.expect.fail("Expected stop to fail when server is not started");
        }
        catch {
            (0, chai_1.expect)(true).to.be.true;
        }
    });
    it("PUT should fail when no zip data is provided", async function () {
        const res = await (0, supertest_1.default)("http://localhost:4321")
            .put("/dataset/rooms/rooms")
            .set("Content-Type", "application/x-zip-compressed");
        (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.BAD_REQUEST);
        (0, chai_1.expect)(res.body).to.have.property("error");
    });
    describe("POST /query", function () {
        it("POST test for a valid query", async function () {
            await (0, supertest_1.default)("http://localhost:4321")
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
            const res = await (0, supertest_1.default)("http://localhost:4321")
                .post("/query")
                .send(query)
                .set("Content-Type", "application/json");
            (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.OK);
            (0, chai_1.expect)(res.body).to.have.property("result");
            (0, chai_1.expect)(res.body.result).to.be.an("array");
        });
        it("POST should fail with invalid query", async function () {
            const query = {
                WHERE: {},
                OPTIONS: {
                    COLUMNS: ["nonexistent_field"],
                },
            };
            const res = await (0, supertest_1.default)("http://localhost:4321")
                .post("/query")
                .send(query)
                .set("Content-Type", "application/json");
            (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.BAD_REQUEST);
            (0, chai_1.expect)(res.body).to.have.property("error");
        });
        it("POST should fail if dataset has not been added", async function () {
            const query = {
                WHERE: {},
                OPTIONS: {
                    COLUMNS: ["fakeid_shortname"],
                },
            };
            const res = await (0, supertest_1.default)("http://localhost:4321")
                .post("/query")
                .send(query)
                .set("Content-Type", "application/json");
            (0, chai_1.expect)(res.status).to.equal(http_status_codes_1.StatusCodes.BAD_REQUEST);
            (0, chai_1.expect)(res.body).to.have.property("error");
        });
    });
});
//# sourceMappingURL=Server.spec.js.map