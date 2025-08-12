"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const chai_1 = require("chai");
const GeneralHelpers_1 = require("../../src/util/GeneralHelpers");
(0, chai_1.use)(chai_as_promised_1.default);
describe("isValidId", function () {
    it("return false given an empty string", function () {
        const result = (0, GeneralHelpers_1.isValidId)("");
        (0, chai_1.expect)(result).to.equal(false);
    });
    it("return false given a string with only whitespace", function () {
        const result = (0, GeneralHelpers_1.isValidId)(" \n\t");
        (0, chai_1.expect)(result).to.equal(false);
    });
    it("return false given an underscore", function () {
        const result = (0, GeneralHelpers_1.isValidId)("_");
        (0, chai_1.expect)(result).to.equal(false);
    });
    it("return false given a string containing an underscore", function () {
        const result = (0, GeneralHelpers_1.isValidId)("sections_");
        (0, chai_1.expect)(result).to.equal(false);
    });
    it("return false given whitespace and underscore", function () {
        const result = (0, GeneralHelpers_1.isValidId)(" \n\t_ \n\t");
        (0, chai_1.expect)(result).to.equal(false);
    });
    it("return false given a string with both whitespace and underscore", function () {
        const result = (0, GeneralHelpers_1.isValidId)(" \n\t_ \n\t");
        (0, chai_1.expect)(result).to.equal(false);
    });
    it("return true given a string", function () {
        const result = (0, GeneralHelpers_1.isValidId)("sections");
        (0, chai_1.expect)(result).to.equal(true);
    });
    it("return true given a string with space in between", function () {
        const result = (0, GeneralHelpers_1.isValidId)("sect ions");
        (0, chai_1.expect)(result).to.equal(true);
    });
    it("return true given a string with space in between and outside", function () {
        const result = (0, GeneralHelpers_1.isValidId)(" sect ions ");
        (0, chai_1.expect)(result).to.equal(true);
    });
});
//# sourceMappingURL=GeneralHelpers.spec.js.map