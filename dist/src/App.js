"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const project_support_1 = require("@ubccpsc310/project-support");
const Server_1 = __importDefault(require("./rest/Server"));
class App {
    async initServer(port) {
        project_support_1.Log.info(`App::initServer( ${port} ) - start`);
        const server = new Server_1.default(port);
        return server
            .start()
            .then(() => {
            project_support_1.Log.info("App::initServer() - started");
        })
            .catch((err) => {
            project_support_1.Log.error(`App::initServer() - ERROR: ${err.message}`);
        });
    }
}
exports.App = App;
project_support_1.Log.info("App - starting");
const port = 4321;
const app = new App();
(async () => {
    await app.initServer(port);
})();
//# sourceMappingURL=App.js.map