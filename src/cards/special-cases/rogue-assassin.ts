import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 3 EnergyRune (Use only if not Empowered.)
 * [Action][>] Exhaust: If it's your turn, move a friendly unit in a showdown to base and if I'm
 * [Empowered], ready it.
 *
 * Moot — "a showdown" (a battlefield with units from both sides actively fighting) isn't a
 * queryable, distinct game state in this engine, and the payoff of Empowering this card is
 * entirely inside that unimplemented second ability, so implementing Empower alone would have no
 * observable effect (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const rogueAssassin: SpecialCaseHandler = {
  cardId: "rogue-assassin",
};
