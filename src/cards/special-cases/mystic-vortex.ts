import type { SpecialCaseHandler } from "./types";

/**
 * During showdowns here, cards with [Reaction] cost Rune more to play. (Hidden cards have
 * [Reaction].)
 *
 * Moot — [Reaction]/showdown timing isn't modeled (spells resolve instantly, with no reactive
 * response window to raise the cost of — deferred, see abandon.ts's identical note). No fallback
 * mode.
 */
export const mysticVortex: SpecialCaseHandler = {
  cardId: "mystic-vortex",
};
