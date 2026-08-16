import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell that costs no more than 4 Energy and no more than Rune.
 *
 * Moot — entirely gated behind Counter, which isn't wired up (deferred, see abandon.ts's
 * identical note).
 */
export const defy: SpecialCaseHandler = {
  cardId: "defy",
};
