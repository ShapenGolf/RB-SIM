import type { SpecialCaseHandler } from "./types";

/**
 * At the start of your Beginning Phase, if you control a facedown card at a battlefield, draw 1.
 *
 * Moot — [Hidden]/facedown state isn't modeled as a distinct, queryable board state (deferred,
 * see docs/data-sourcing.md). No fallback mode.
 */
export const mushroomPouch: SpecialCaseHandler = {
  cardId: "mushroom-pouch",
};
