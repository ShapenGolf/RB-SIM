import type { SpecialCaseHandler } from "./types";

/**
 * Any player may pay Rune Rune as an additional cost to play a Dragon. If they do, they play it
 * to this battlefield.
 *
 * Moot — this session's additionalPlayCostEnergy-style hooks model a single card's own
 * additional cost, not a Battlefield granting an alternate PLAY DESTINATION to any matching card
 * (tag-filtered "Dragon") for a Rune cost, for either player — no chokepoint fits this shape
 * (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const dragonRoost: SpecialCaseHandler = {
  cardId: "dragon-roost",
};
