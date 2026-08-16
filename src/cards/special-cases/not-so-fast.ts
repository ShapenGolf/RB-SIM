import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter an enemy spell or ability that chooses a friendly unit or gear.
 *
 * Moot — entirely gated behind Counter, which isn't wired up (deferred, see abandon.ts's
 * identical note).
 */
export const notSoFast: SpecialCaseHandler = {
  cardId: "not-so-fast",
};
