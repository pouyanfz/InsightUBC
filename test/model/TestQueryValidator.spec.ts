import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { loadTestQuery } from "../TestUtil";
import QueryValidator from "../../src/model/Query/QueryValidator";
import { InsightError } from "../../src/controller/IInsightFacade";

use(chaiAsPromised);

describe("QueryValidator", function () {
	describe("isValidQuery", function () {
		async function expectFalse(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error("Invalid call to expectFalse");
			}
			const query = await loadTestQuery(this.test.title);
			try {
				QueryValidator.isValidQuery(query.input);
				expect.fail("Query should have failed");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		}

		async function expectTrue(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error("Invalid call to expectTrue");
			}
			const query = await loadTestQuery(this.test.title);
			try {
				const result = QueryValidator.isValidQuery(query.input);
				expect(result).to.equal(true);
			} catch {
				expect.fail("Query should have been valid");
			}
		}

		// -----------------------------------valid queries-----------------------------------
		it("[Courses/valid/matchExactly.json] valid match exactly", expectTrue);
		it("[Courses/valid/startsWith.json] valid wildcard at te beginning", expectTrue);
		it("[Courses/valid/endsWith.json] valid wildcard at the end", expectTrue);
		it("[Courses/valid/contains.json] valid wildcard contains ps", expectTrue);
		it("[Courses/valid/noResult.json] valid no result", expectTrue);

		// Comparison operators
		it("[Courses/valid/largerThan.json] valid greater than", expectTrue);
		it("[Courses/valid/lessThan.json] valid less than", expectTrue);
		it("[Courses/valid/lessThanEqual.json] valid less than or equal", expectTrue);
		it("[Courses/valid/greaterThanEqual.json] valid greater than or equal", expectTrue);
		it("[Courses/valid/equal.json] valid equal", expectTrue);
		it("[Courses/valid/overlappingComparison.json] valid overlapping comparison", expectTrue);
		it("[Courses/valid/overlappingComparison2.json] valid overlapping comparison", expectTrue);

		// Logical combinations
		it("[Courses/valid/and.json] valid AND combination", expectTrue);
		it("[Courses/valid/or.json] valid OR combination", expectTrue);
		it("[Courses/valid/not.json] valid NOT", expectTrue);
		it("[Courses/valid/nestedLogic.json] valid nested AND/OR/NOT", expectTrue);
		it("[Courses/valid/andNot.json] valid AND/NOT", expectTrue);
		it("[Courses/valid/orNot.json] valid OR/NOT", expectTrue);
		it("[Courses/valid/andOrNot.json] valid AND/OR/NOT", expectTrue);
		it("[Courses/valid/is.json] valid IS", expectTrue);
		it("[Courses/valid/singleOr.json] valid single OR", expectTrue);
		it("[Courses/valid/singleAnd.json] valid single AND", expectTrue);
		it("[Courses/valid/wildcardAnd.json] valid wildcard/AND", expectTrue);
		it("[Courses/valid/doubleWildcard.json] valid double wildcard", expectTrue);

		// Valid all columns
		it("[Courses/valid/allColumns.json] valid all columns", expectTrue);
		// it("[Rooms/valid/allColumnsRooms.json] valid all columns for Rooms", expectTrue);

		// Valid ORDER cases
		it("[Courses/valid/orderByString.json] valid ORDER by string field", expectTrue);
		it("[Courses/valid/orderByNumber.json] valid ORDER by numeric field", expectTrue);
		it("[Courses/valid/orderDirKeys.json] valid ORDER DOWN by number and string fields", expectTrue);
		it("[Courses/valid/orderDirKeys2.json] valid ORDER UP by numeric and string fields", expectTrue);

		// Valid TRANSFORMATIONS cases
		it("[Courses/valid/emptyApply.json] valid query with an empty apply list", expectTrue);
		it("[Courses/valid/transformationAvg.json] valid query with AVG", expectTrue);
		it("[Courses/valid/transformationCountNumeric.json] valid query with numeric COUNT", expectTrue);
		it("[Courses/valid/transformationCountString.json] valid query with string COUNT", expectTrue);
		it("[Courses/valid/transformationManyApply.json] valid query with more than 1 apply rule", expectTrue);
		it("[Courses/valid/transformationMax.json] valid query with MAX", expectTrue);
		it("[Courses/valid/transformationMin.json] valid query with MIN", expectTrue);
		it("[Courses/valid/transformationSum.json] valid query with SUM", expectTrue);

		// Complex queries
		it("[Courses/valid/complexQuery.json] valid complex query", expectTrue);
		it("[Courses/valid/complexQuery2.json] valid complex query", expectTrue);
		it("[Courses/valid/allParameters.json] valid query with all parameters", expectTrue);
		it("[Courses/valid/caseSensitiveScomp.json] valid case sensitive query", expectTrue);
		it("[Courses/valid/duplicateColumn.json] valid query with duplicate columns", expectTrue);
		it("[Courses/valid/whereAtTheEnd.json] valid query with WHERE at the end", expectTrue);
		it("[Courses/valid/deeplyNested.json] valid deeply nested query", expectTrue);
		it("[Rooms/valid/transformationComplex.json] valid query using all functions", expectTrue);

		// -----------------------------------invalid queries-----------------------------------
		it("[Courses/invalid/invalid.json] invalid Query missing WHERE", expectFalse);
		it("[Courses/invalid/orderByInvalid.json] invalid ORDER by invalid field", expectFalse);
		it("[Courses/invalid/missingColumn.json] empty column in SELECT", expectFalse);
		it("[Courses/invalid/invalidColumn.json] invalid column in SELECT", expectFalse);
		it("[Courses/invalid/invalidKey.json] invalid column key", expectFalse);
		it("[Courses/invalid/mcomparisonString.json] numeric comparator with string", expectFalse);
		it("[Courses/invalid/scomparisonNumber.json] string comparator with numeric", expectFalse);
		it("[Courses/invalid/invalidID.json] invalid id with underscore", expectFalse);
		it("[Courses/invalid/invalidIdNoCharacter.json] invalid id with no characters", expectFalse);
		it("[Courses/invalid/extraTopKey.json] invalid with extra top level key", expectFalse);
		it("[Courses/invalid/extraInOptions.json] invalid OPTIONS with extra property", expectFalse);
		it("[Courses/invalid/multiKey.json] invalid ", expectFalse);
		it("[Courses/invalid/whiteSpaceId.json] invalid dataset id with whiespace ID", expectFalse);
		it("[Courses/invalid/invalidID2.json] invalid field name casing in query", expectFalse);
		it("[Courses/invalid/orderNotInColumns.json] invalid ORDER by not in columns", expectFalse);
		it("[Courses/invalid/invalidNesting.json] invalid comparison nesting", expectFalse);
		it("[Courses/invalid/mcompNoKey.json] invalid numeric comparator with no key", expectFalse);
		it("[Courses/invalid/scompNoKey.json] invalid string comparator with no key", expectFalse);
		it("[Courses/invalid/multipleFilter.json] invalid multiple filters", expectFalse);
		it("[Courses/invalid/noUnderscoreKey.json] invalid idstring with no underscore", expectFalse);
		it("[Courses/invalid/noWhere.json] invalid dataset", expectFalse);
		it("[Courses/invalid/mixedDataset.json] invalid mixed datasets", expectFalse);
		it("[Courses/invalid/datasetNotAdded.json] invalid dataset not added", expectFalse);
		it("[Courses/invalid/invalidWildcard.json] invalid wildcard in middle query", expectFalse);
		it("[Courses/invalid/invalidWildcard2.json] invalid wildcard all * query", expectFalse);
		it("[Courses/invalid/invalidWildcard3.json] invalid wildcard all * query", expectFalse);
		it("[Courses/invalid/missingOptions.json] invalid query with missing options", expectFalse);
		it("[Courses/invalid/onlyNot.json] invalid query with only NOT", expectFalse);
		it("[Courses/invalid/emptyAndOr.json] invalid query with empty AND/OR", expectFalse);
		it("[Courses/invalid/multipleKeysComparison.json] invalid multiple key for comparison", expectFalse);
		it("[Courses/invalid/multipleKeysIs.json] invalid multiple key with IS", expectFalse);
		it("[Courses/invalid/keyStartingUnderscore.json] invalid key starts with _", expectFalse);
		it("[Courses/invalid/notMultipleFilters.json] invalid NOT with multiple filters", expectFalse);
		it("[Courses/invalid/comparisonNoKey.json] invalid comparison with no key", expectFalse);
		it("[Courses/invalid/comparisonNoKey.json] invalid IS with no key", expectFalse);
		it("[Courses/invalid/lowercaseClause.json] invalid lowercase clause", expectFalse);
		it("[Courses/invalid/andAsObject.json] invalid AND as object", expectFalse);
		it("[Courses/invalid/orderAsObject.json] invalid ORDER as object", expectFalse);
		it("[Courses/invalid/emptyNot.json] invalid empty NOT", expectFalse);
		it("[Courses/invalid/emptyEqual.json] invalid empty equal", expectFalse);
		it("[Courses/invalid/numberAsString.json] invalid number as string", expectFalse);
		it("[Courses/invalid/emptyGT.json] invalid empty GT filter", expectFalse);
		it("[Courses/invalid/emptyIS.json] invalid empty IS filter", expectFalse);
		it(
			"[Courses/invalid/bothKeys.json] invalid query that tries to use keys from both Sections and Rooms",
			expectFalse
		);
		it("[Courses/invalid/extraOrderKey.json] invalid query that has an extra key in the order object", expectFalse);
		it("[Courses/invalid/invalidOrderDir.json] invalid query that has an invalid dir value", expectFalse);
		it("[Courses/invalid/invalidOrderKeys.json] invalid query that has an invalid key in keys", expectFalse);
		it("[Courses/invalid/emptyOrderKeys.json] invalid query that has an empty key array", expectFalse);

		// invalid transformation tests
		it("[Courses/invalid/transformationExtraKey.json] invalid query that an extra key in TRANSFORMS", expectFalse);
		it(
			"[Courses/invalid/transformationMissingKey.json] invalid query that is missing a key in TRANSFORMS",
			expectFalse
		);
		it(
			"[Courses/invalid/transformationSameApplyKey.json] invalid query that has two of the same apply key",
			expectFalse
		);
		it("[Courses/invalid/emptyGroup.json] invalid query with empty group", expectFalse);
		it("[Courses/invalid/groupInvalidKey.json] invalid query with an invalid key in group", expectFalse);
		it("[Courses/invalid/invalidApplyKey.json] invalid query with an invalid applykey", expectFalse);
		it("[Courses/invalid/invalidApplyRule.json] invalid query with an invalid apply rule", expectFalse);
		it("[Courses/invalid/invalidAvgKey.json] invalid query that uses a string field for AVG", expectFalse);
		it("[Courses/invalid/invalidMaxKey.json] invalid query that uses a string field for MAX", expectFalse);
		it("[Courses/invalid/invalidMinKey.json] invalid query that uses a string field for MIN", expectFalse);
		it("[Courses/invalid/invalidSumKey.json] invalid query that uses a string field for SUM", expectFalse);

		// Tyler's extra tests
		// Invalid ORDER tests
		it("[Courses/invalid/invalid_order.json] Query has invalid ORDER", expectFalse);

		// Missing argument tests
		it("[Courses/invalid/input_not_object.json] Query has non-object input", expectFalse);
	});
});
