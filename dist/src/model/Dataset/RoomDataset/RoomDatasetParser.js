"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jszip_1 = __importDefault(require("jszip"));
const http_1 = __importDefault(require("http"));
const IInsightFacade_1 = require("../../../controller/IInsightFacade");
const HTMLRoomParser_1 = __importDefault(require("./HTMLRoomParser"));
const RoomsDataset_1 = __importDefault(require("./RoomsDataset"));
const GEO_BASE = "http://cs310.students.cs.ubc.ca:11316/api/v1";
const TEAM = "project_team046";
class RoomDatasetParser {
    static async parse(content, id) {
        try {
            const zip = await jszip_1.default.loadAsync(content, { base64: true });
            const indexHtml = await zip.file("index.htm")?.async("string");
            if (!indexHtml)
                throw new IInsightFacade_1.InsightError("Missing index.htm");
            const buildings = HTMLRoomParser_1.default.extractBuildings(indexHtml);
            const roomPromises = buildings.map(async (b) => {
                return this.parseBuildingRooms(zip, b);
            });
            const roomsList = await Promise.all(roomPromises);
            const allRooms = roomsList.flat().map((room) => {
                const prefixed = {};
                for (const key in room) {
                    prefixed[`${id}_${key}`] = room[key];
                }
                return prefixed;
            });
            if (allRooms.length === 0)
                throw new IInsightFacade_1.InsightError("No valid rooms found");
            return new RoomsDataset_1.default(id, IInsightFacade_1.InsightDatasetKind.Rooms, allRooms);
        }
        catch (_err) {
            throw new IInsightFacade_1.InsightError("Failed to parse rooms dataset");
        }
    }
    static async parseBuildingRooms(zip, building) {
        try {
            const file = await zip.file(building.href.replace(/^\.\//, ""))?.async("string");
            if (!file)
                return [];
            const geo = await this.fetchGeo(building.address);
            const parsed = HTMLRoomParser_1.default.extractRooms(file);
            return parsed.map((room) => ({
                fullname: building.fullname,
                shortname: building.shortname,
                address: building.address,
                lat: geo.lat,
                lon: geo.lon,
                number: room.number,
                name: `${building.shortname}_${room.number}`,
                seats: (() => {
                    const seatNum = Number(room.seats);
                    return Number.isInteger(seatNum) && seatNum > 0 ? seatNum : 0;
                })(),
                type: room.type,
                furniture: room.furniture,
                href: room.href,
            }));
        }
        catch {
            return [];
        }
    }
    static async fetchGeo(address) {
        const url = `${GEO_BASE}/${TEAM}/${encodeURIComponent(address)}`;
        return new Promise((resolve, reject) => {
            http_1.default
                .get(url, (res) => {
                let body = "";
                res.on("data", (chunk) => (body += chunk));
                res.on("end", () => {
                    try {
                        const json = JSON.parse(body);
                        if (json.lat && json.lon) {
                            resolve({ lat: json.lat, lon: json.lon });
                        }
                        else {
                            reject(new Error(json.error ?? "Missing lat/lon"));
                        }
                    }
                    catch {
                        reject(new Error("Invalid geo JSON"));
                    }
                });
            })
                .on("error", () => reject(new Error("Geo request failed")));
        });
    }
}
exports.default = RoomDatasetParser;
//# sourceMappingURL=RoomDatasetParser.js.map