import type { SpecialCaseHandler } from "./types";

/**
 * Rune, Exhaust: Give the next spell you play this turn [Repeat] equal to its cost.
 *
 * [Repeat] isn't wired up (~24 occurrences, deliberately not built — see docs/data-sourcing.md).
 * This card's entire function is granting Repeat, so nothing is implementable once it's skipped.
 */
export const temporalPortal: SpecialCaseHandler = {
  cardId: "temporal-portal",
};
