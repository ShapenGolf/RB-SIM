import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Choose a friendly unit at a battlefield. Counter an enemy spell or ability that chooses it and
 * no other friendly unit.
 *
 * Moot — entirely gated behind Counter, which isn't wired up (deferred, see abandon.ts's
 * identical note).
 */
export const repulse: SpecialCaseHandler = {
  cardId: "repulse",
};
