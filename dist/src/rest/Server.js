"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const project_support_1 = require("@ubccpsc310/project-support");
const cors_1 = __importDefault(require("cors"));
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Server {
    port;
    express;
    server;
    insightFacade = new InsightFacade_1.default();
    constructor(port) {
        project_support_1.Log.info(`Server::<init>( ${port} )`);
        this.port = port;
        this.express = (0, express_1.default)();
        this.registerMiddleware();
        this.registerRoutes();
        this.express.use(express_1.default.static("./frontend/public"));
    }
    async start() {
        return new Promise((resolve, reject) => {
            project_support_1.Log.info("Server::start() - start");
            if (this.server !== undefined) {
                project_support_1.Log.error("Server::start() - server already listening");
                reject();
            }
            else {
                this.server = this.express
                    .listen(this.port, () => {
                    project_support_1.Log.info(`Server::start() - server listening on port: ${this.port}`);
                    resolve();
                })
                    .on("error", (err) => {
                    project_support_1.Log.error(`Server::start() - server ERROR: ${err.message}`);
                    reject(err);
                });
            }
        });
    }
    async stop() {
        project_support_1.Log.info("Server::stop()");
        return new Promise((resolve, reject) => {
            if (this.server === undefined) {
                project_support_1.Log.error("Server::stop() - ERROR: server not started");
                reject();
            }
            else {
                this.server.close(() => {
                    project_support_1.Log.info("Server::stop() - server closed");
                    resolve();
                });
            }
        });
    }
    registerMiddleware() {
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.raw({ type: "application/*", limit: "10mb" }));
        this.express.use((0, cors_1.default)());
    }
    registerRoutes() {
        this.express.get("/echo/:msg", Server.echo);
        this.express.put("/dataset/:id/:kind", this.handlePutDataset);
        this.express.delete("/dataset/:id", this.handleDeleteDataset);
        this.express.post("/query", this.handlePostQuery);
        this.express.get("/datasets", this.handleGetDatasets);
    }
    static echo(req, res) {
        try {
            project_support_1.Log.info(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
            const response = Server.performEcho(req.params.msg);
            res.status(http_status_codes_1.StatusCodes.OK).json({ result: response });
        }
        catch (err) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err });
        }
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
    handlePutDataset = async (req, res) => {
        try {
            const { id, kind } = req.params;
            const base64 = req.body.toString("base64");
            const result = await this.insightFacade.addDataset(id, base64, kind);
            res.status(http_status_codes_1.StatusCodes.OK).json({ result });
        }
        catch (err) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
    };
    handleDeleteDataset = async (req, res) => {
        try {
            const { id } = req.params;
            const result = await this.insightFacade.removeDataset(id);
            res.status(http_status_codes_1.StatusCodes.OK).json({ result });
        }
        catch (err) {
            if (err instanceof IInsightFacade_1.NotFoundError) {
                res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: err.message });
            }
            else {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
            }
        }
    };
    handlePostQuery = async (req, res) => {
        try {
            const result = await this.insightFacade.performQuery(req.body);
            res.status(http_status_codes_1.StatusCodes.OK).json({ result });
        }
        catch (err) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
    };
    handleGetDatasets = async (req, res) => {
        try {
            const result = await this.insightFacade.listDatasets();
            res.status(http_status_codes_1.StatusCodes.OK).json({ result });
        }
        catch (err) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
    };
}
exports.default = Server;
//# sourceMappingURL=Server.js.map