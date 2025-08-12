import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { isValidId } from "../../src/util/GeneralHelpers";

use(chaiAsPromised);

describe("isValidId", function () {
	// False tests
	it("return false given an empty string", function () {
		const result = isValidId("");
		expect(result).to.equal(false);
	});

	it("return false given a string with only whitespace", function () {
		const result = isValidId(" \n\t");
		expect(result).to.equal(false);
	});

	it("return false given an underscore", function () {
		const result = isValidId("_");
		expect(result).to.equal(false);
	});

	it("return false given a string containing an underscore", function () {
		const result = isValidId("sections_");
		expect(result).to.equal(false);
	});

	it("return false given whitespace and underscore", function () {
		const result = isValidId(" \n\t_ \n\t");
		expect(result).to.equal(false);
	});

	it("return false given a string with both whitespace and underscore", function () {
		const result = isValidId(" \n\t_ \n\t");
		expect(result).to.equal(false);
	});

	// True tests
	it("return true given a string", function () {
		const result = isValidId("sections");
		expect(result).to.equal(true);
	});

	it("return true given a string with space in between", function () {
		const result = isValidId("sect ions");
		expect(result).to.equal(true);
	});

	it("return true given a string with space in between and outside", function () {
		const result = isValidId(" sect ions ");
		expect(result).to.equal(true);
	});
});
