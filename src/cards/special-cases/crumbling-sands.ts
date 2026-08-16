import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell if an opponent has played another spell this turn.
 *
 * Moot — entirely gated behind Counter, which isn't wired up (deferred, see abandon.ts's
 * identical note).
 */
export const crumblingSands: SpecialCaseHandler = {
  cardId: "crumbling-sands",
};
