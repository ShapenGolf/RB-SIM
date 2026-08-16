import type { SpecialCaseHandler } from "./types";

/**
 * When a player chooses a friendly unit here with a spell for the first time each turn, they
 * draw 1.
 *
 * Moot — no generic "chosen as a target" broadcast exists (deferred, see jae-medarda.ts's
 * identical note). No fallback mode.
 */
export const theDreamingTree: SpecialCaseHandler = {
  cardId: "the-dreaming-tree",
};
