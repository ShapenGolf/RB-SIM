import type { SpecialCaseHandler } from "./types";

/**
 * [Shield 5] (+5 Might while I'm a defender.)
 * [Tank] (I must be assigned combat damage first.)
 * I cost 2 EnergyCalm Rune less for each point you scored from holding this turn.
 *
 * [Shield]/[Tank] are printed keywords, already generic. The cost clause is moot — points are
 * tracked as a single running total (player.points), not tagged by SOURCE (holding vs. other
 * scoring), so "points scored from holding this turn" specifically can't be isolated (deferred,
 * see docs/data-sourcing.md). No fallback mode for that clause.
 */
export const needlesslyLargeYordle: SpecialCaseHandler = {
  cardId: "needlessly-large-yordle",
};
