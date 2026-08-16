import type { SpecialCaseHandler } from "./types";

/**
 * [Ganking] (I can move from battlefield to battlefield.)
 * The third time I move in a turn, you score 1 point.
 *
 * [Ganking] is a printed keyword, already generic. "The third time I move" needs a per-instance
 * numeric move counter this engine doesn't track (deferred, see kayn-unleashed.ts's identical
 * note). No fallback mode for that clause.
 */
export const yasuoWindrider: SpecialCaseHandler = {
  cardId: "yasuo-windrider",
};
