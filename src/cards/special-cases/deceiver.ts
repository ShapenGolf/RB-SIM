import type { SpecialCaseHandler } from "./types";

/**
 * When you conquer or hold, you may discard 1 and exhaust me to play a ready Reflection unit
 * token there. It becomes a copy of another unit there. Give it [Temporary].
 *
 * Moot — "becomes a copy of another unit" is ability-copying, not modeled (deferred, see
 * heimerdinger-inventor.ts's identical note). No fallback mode.
 */
export const deceiver: SpecialCaseHandler = {
  cardId: "deceiver",
};
