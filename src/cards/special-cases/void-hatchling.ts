import type { SpecialCaseHandler } from "./types";

/**
 * If you would reveal cards from a deck, look at the top card first. You may recycle it. Then
 * reveal those cards.
 *
 * Moot — a global replacement effect over every "reveal cards from a deck" action, which this
 * engine implements independently at each card's own bespoke site rather than through one shared
 * chokepoint (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const voidHatchling: SpecialCaseHandler = {
  cardId: "void-hatchling",
};
