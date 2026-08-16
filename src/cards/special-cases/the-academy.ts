import type { SpecialCaseHandler } from "./types";

/**
 * When you hold here, give your next spell this turn [Repeat] equal to its base cost.
 *
 * [Repeat] isn't wired up (~24 occurrences, deliberately not built — see docs/data-sourcing.md).
 * This card's entire function is granting Repeat, so nothing is implementable once it's skipped.
 */
export const theAcademy: SpecialCaseHandler = {
  cardId: "the-academy",
};
