import type { SpecialCaseHandler } from "./types";

/**
 * When one of your units becomes [Mighty], you may exhaust me to channel 1 rune exhausted. (A
 * unit is Mighty while it has 5+ Might.)
 *
 * Moot — "becomes Mighty" is an unmodeled state transition (deferred, see fiora-worthy.ts's
 * identical note). No fallback mode.
 */
export const grandDuelist: SpecialCaseHandler = {
  cardId: "grand-duelist",
};
