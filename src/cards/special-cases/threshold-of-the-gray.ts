import type { SpecialCaseHandler } from "./types";

/**
 * When combat starts here, the attacker and defender each [Add] 1 Energy.
 *
 * The [Add] resource-generation keyword isn't wired up (~50 occurrences, deliberately not
 * built — see docs/data-sourcing.md). Nothing left to implement once it's skipped.
 */
export const thresholdOfTheGray: SpecialCaseHandler = {
  cardId: "threshold-of-the-gray",
};
