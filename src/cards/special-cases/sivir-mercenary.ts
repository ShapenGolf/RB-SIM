import type { SpecialCaseHandler } from "./types";

/**
 * [Accelerate] (You may pay 1 EnergyChaos Rune as an additional cost to have me enter ready.)
 * If you've spent at least Rune Rune this turn, I have +2 Might and [Ganking].
 *
 * [Accelerate] is a printed keyword, already generic. "Spent at least 2 Rune this turn" needs an
 * aggregate rune-spending counter across every payment type this turn, which this engine doesn't
 * track (only maxEnergySpentOnSpellThisTurn exists, scoped to spell Energy specifically) —
 * deferred, see docs/data-sourcing.md. No fallback mode for that clause.
 */
export const sivirMercenary: SpecialCaseHandler = {
  cardId: "sivir-mercenary",
};
