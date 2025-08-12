"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IDataset {
    id;
    kind;
    rows;
    constructor(id, kind, rows) {
        this.id = id;
        this.kind = kind;
        this.rows = rows;
    }
    get numRows() {
        return this.rows.length;
    }
    toDiskFormat() {
        return {
            id: this.id,
            kind: this.kind,
            rows: this.rows,
        };
    }
}
exports.default = IDataset;
//# sourceMappingURL=IDataset.js.map