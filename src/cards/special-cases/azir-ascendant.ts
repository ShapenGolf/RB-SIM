import type { SpecialCaseHandler } from "./types";

/**
 * Calm Rune: [Action] — Choose a unit you control. Move me to its location and it to my original
 * location. If it's equipped, you may attach one of its Equipment to me. Use only once per turn.
 *
 * Moot — a position SWAP (both units trade locations simultaneously) has no existing helper;
 * move-helpers.ts's functions move one unit at a time to a destination, not a two-way exchange.
 * Not implemented for this one card (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const azirAscendant: SpecialCaseHandler = {
  cardId: "azir-ascendant",
};
