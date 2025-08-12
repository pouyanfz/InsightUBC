/**
 * RoomDatasetParser.ts
 * ---------------------
 * Parses a base64-encoded ZIP file containing UBC room data.
 *
 * Responsibilities:
 * - Extract building metadata from index.htm
 * - Parse individual building HTML pages for room details
 * - Retrieve geolocation (lat/lon) for each building via HTTP API
 * - Assemble validated InsightResult[] entries for all rooms
 * - Return a RoomsDataset instance containing all parsed room data
 *
 * Produces: RoomsDataset
 * Used by: DatasetParser.ts
 */


import JSZip from "jszip";
import http from "http";
import { InsightDatasetKind, InsightError, InsightResult } from "../../../controller/IInsightFacade";
import HTMLRoomParser, { BuildingData } from "./HTMLRoomParser";
import RoomsDataset from "./RoomsDataset";

const GEO_BASE = "http://cs310.students.cs.ubc.ca:11316/api/v1";
const TEAM = "project_team046";

export default class RoomDatasetParser {
	public static async parse(content: string, id: string): Promise<RoomsDataset> {
		try {
			// console.log("Loading zip...");
			const zip = await JSZip.loadAsync(content, { base64: true });

			// console.log("Reading index.htm...");
			const indexHtml = await zip.file("index.htm")?.async("string");
			if (!indexHtml) throw new InsightError("Missing index.htm");

			// console.log("Extracting buildings...");
			const buildings = HTMLRoomParser.extractBuildings(indexHtml);
			// console.log("Found buildings:", buildings.map((b) => b.shortname));

			const roomPromises = buildings.map(async (b) => {
				// console.log(`Parsing building: ${b.shortname}`);
				return this.parseBuildingRooms(zip, b);
			});

			const roomsList = await Promise.all(roomPromises);
			// console.log("Parsed roomsList:", roomsList.map((r) => r.length));

			const allRooms = roomsList.flat().map((room) => {
				const prefixed: InsightResult = {};
				for (const key in room) {
					prefixed[`${id}_${key}`] = room[key];
				}
				return prefixed;
			});

			// console.log("Total valid rooms:", allRooms.length);
			if (allRooms.length === 0) throw new InsightError("No valid rooms found");

			return new RoomsDataset(id, InsightDatasetKind.Rooms, allRooms);
		} catch (_err) {
			// console.error("RoomDatasetParser error:", err);
			throw new InsightError("Failed to parse rooms dataset");
		}
	}

	private static async parseBuildingRooms(zip: JSZip, building: BuildingData): Promise<InsightResult[]> {
		try {
			const file = await zip.file(building.href.replace(/^\.\//, ""))?.async("string");
			if (!file) return [];
			const geo = await this.fetchGeo(building.address);
			const parsed = HTMLRoomParser.extractRooms(file);

			return parsed.map((room) => ({
				fullname: building.fullname,
				shortname: building.shortname,
				address: building.address,
				lat: geo.lat,
				lon: geo.lon,
				number: room.number,
				name: `${building.shortname}_${room.number}`,
				seats: ((): number => {
					const seatNum = Number(room.seats);
					return Number.isInteger(seatNum) && seatNum > 0 ? seatNum : 0;
				})(),
				type: room.type,
				furniture: room.furniture,
				href: room.href,
			}));
		} catch {
			return [];
		}
	}

	// This method was created with the assistance of AI tools.
	private static async fetchGeo(address: string): Promise<{ lat: number; lon: number }> {
		const url = `${GEO_BASE}/${TEAM}/${encodeURIComponent(address)}`;
		return new Promise((resolve, reject) => {
			http
				.get(url, (res) => {
					let body = "";
					res.on("data", (chunk) => (body += chunk));
					res.on("end", () => {
						try {
							const json = JSON.parse(body);
							if (json.lat && json.lon) {
								resolve({ lat: json.lat, lon: json.lon });
							} else {
								reject(new Error(json.error ?? "Missing lat/lon"));
							}
						} catch {
							reject(new Error("Invalid geo JSON"));
						}
					});
				})
				.on("error", () => reject(new Error("Geo request failed")));
		});
	}
}
