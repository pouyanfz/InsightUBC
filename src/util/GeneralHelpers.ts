/**
 * GeneralHelpers.ts
 * -----------------
 * Collection of simple validation and utility functions.
 *
 * Examples:
 * - ID validation (no underscore, not empty)
 * - isBase64, isNumber, trim helpers if needed
 *
 * Used by: InsightFacade.ts, SectionsDataset.ts, RoomsDataset.ts, QueryValidator.ts
 */

export function isValidId(id: string): boolean {
	return id.trim() !== "" && !id.includes("_");
}
