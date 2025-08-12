"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parse5_1 = require("parse5");
class HTMLRoomParser {
    static extractBuildings(html) {
        const doc = (0, parse5_1.parse)(html);
        const rows = this.findRowsWithClass(doc, "views-field-field-building-address");
        return rows.map((row) => this.parseBuildingRow(row)).filter(Boolean);
    }
    static extractRooms(html) {
        const doc = (0, parse5_1.parse)(html);
        const rows = this.findRowsWithClass(doc, "views-field-field-room-number");
        return rows.map((row) => this.parseRoomRow(row)).filter(Boolean);
    }
    static parseBuildingRow(row) {
        const cells = this.getChildNodes(row, "td");
        const building = {};
        for (const cell of cells) {
            const className = this.getAttr(cell, "class") || "";
            if (className.includes("views-field-title")) {
                const link = this.getChild(cell, "a");
                building.fullname = this.getText(link);
                building.href = this.getAttr(link, "href");
            }
            else if (className.includes("views-field-field-building-code")) {
                building.shortname = this.getText(cell);
            }
            else if (className.includes("views-field-field-building-address")) {
                building.address = this.getText(cell);
            }
        }
        return building.fullname && building.shortname && building.address && building.href
            ? building
            : null;
    }
    static parseRoomRow(row) {
        const cells = this.getChildNodes(row, "td");
        const room = {};
        for (const cell of cells) {
            const className = this.getAttr(cell, "class") || "";
            if (className.includes("views-field-field-room-number")) {
                const link = this.getChild(cell, "a");
                room.number = this.getText(link);
                room.href = this.getAttr(link, "href");
            }
            else if (className.includes("views-field-field-room-capacity")) {
                room.seats = this.getText(cell);
            }
            else if (className.includes("views-field-field-room-type")) {
                room.type = this.getText(cell);
            }
            else if (className.includes("views-field-field-room-furniture")) {
                room.furniture = this.getText(cell);
            }
        }
        return room.number && room.href ? room : null;
    }
    static findRowsWithClass(node, className) {
        const matches = [];
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
    static getText(node) {
        if (!node?.childNodes)
            return "";
        return node.childNodes
            .map((child) => (child.nodeName === "#text" ? child.value : this.getText(child)))
            .join("")
            .trim();
    }
    static getAttr(node, attr) {
        return node?.attrs?.find((a) => a.name === attr)?.value;
    }
    static getChild(node, tagName) {
        return (node.childNodes || []).find((n) => n.nodeName === tagName);
    }
    static getChildNodes(node, tagName) {
        return (node.childNodes || []).filter((n) => n.nodeName === tagName);
    }
}
exports.default = HTMLRoomParser;
//# sourceMappingURL=HTMLRoomParser.js.map