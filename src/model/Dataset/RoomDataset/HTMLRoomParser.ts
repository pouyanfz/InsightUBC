/**
 * HTMLRoomParser.ts
 * ------------------
 * Extracts structured building and room data from raw HTML content.
 *
 * Responsibilities:
 * - Parse building information from index.htm files
 * - Parse room details from individual building HTML files
 * - Traverse and query parse5 DOM trees using class names
 * - Return structured data in BuildingData and RoomData formats
 *
 * Used by: RoomDatasetParser.ts
 */

import { parse } from "parse5";

export interface BuildingData {
	fullname: string;
	shortname: string;
	address: string;
	href: string;
}

export interface RoomData {
	number: string;
	seats: string;
	type: string;
	furniture: string;
	href: string;
}

export default class HTMLRoomParser {
	public static extractBuildings(html: string): BuildingData[] {
		const doc = parse(html);
		const rows = this.findRowsWithClass(doc, "views-field-field-building-address");
		return rows.map((row) => this.parseBuildingRow(row)).filter(Boolean) as BuildingData[];
	}

	public static extractRooms(html: string): RoomData[] {
		const doc = parse(html);
		const rows = this.findRowsWithClass(doc, "views-field-field-room-number");
		return rows.map((row) => this.parseRoomRow(row)).filter(Boolean) as RoomData[];
	}

	private static parseBuildingRow(row: any): BuildingData | null {
		const cells = this.getChildNodes(row, "td");
		const building: Partial<BuildingData> = {};

		for (const cell of cells) {
			const className = this.getAttr(cell, "class") || "";
			if (className.includes("views-field-title")) {
				const link = this.getChild(cell, "a");
				building.fullname = this.getText(link);
				building.href = this.getAttr(link, "href");
			} else if (className.includes("views-field-field-building-code")) {
				building.shortname = this.getText(cell);
			} else if (className.includes("views-field-field-building-address")) {
				building.address = this.getText(cell);
			}
		}

		return building.fullname && building.shortname && building.address && building.href
			? (building as BuildingData)
			: null;
	}

	private static parseRoomRow(row: any): RoomData | null {
		const cells = this.getChildNodes(row, "td");
		const room: Partial<RoomData> = {};

		for (const cell of cells) {
			const className = this.getAttr(cell, "class") || "";
			if (className.includes("views-field-field-room-number")) {
				const link = this.getChild(cell, "a");
				room.number = this.getText(link);
				room.href = this.getAttr(link, "href");
			} else if (className.includes("views-field-field-room-capacity")) {
				room.seats = this.getText(cell);
			} else if (className.includes("views-field-field-room-type")) {
				room.type = this.getText(cell);
			} else if (className.includes("views-field-field-room-furniture")) {
				room.furniture = this.getText(cell);
			}
		}

		return room.number && room.href ? (room as RoomData) : null;
	}

	private static findRowsWithClass(node: any, className: string): any[] {
		const matches: any[] = [];

		if (node.nodeName === "tr") {
			const tds = this.getChildNodes(node, "td");
			if (tds.some((td) => (this.getAttr(td, "class") || "").includes(className))) {
				matches.push(node);
			}
		}

		if (node.childNodes) {
			for (const child of node.childNodes) {
				matches.push(...this.findRowsWithClass(child, className));
			}
		}

		return matches;
	}

	private static getText(node: any): string {
		if (!node?.childNodes) return "";
		return node.childNodes
			.map((child: any) => (child.nodeName === "#text" ? child.value : this.getText(child)))
			.join("")
			.trim();
	}

	private static getAttr(node: any, attr: string): string | undefined {
		return node?.attrs?.find((a: any) => a.name === attr)?.value;
	}

	private static getChild(node: any, tagName: string): any {
		return (node.childNodes || []).find((n: any) => n.nodeName === tagName);
	}

	private static getChildNodes(node: any, tagName: string): any[] {
		return (node.childNodes || []).filter((n: any) => n.nodeName === tagName);
	}
}
