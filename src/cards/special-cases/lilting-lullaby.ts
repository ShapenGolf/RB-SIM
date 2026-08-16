import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell. Its controller can't play spells this turn.
 *
 * Moot — entirely gated behind Counter, which isn't wired up (deferred, see abandon.ts's
 * identical note).
 */
export const liltingLullaby: SpecialCaseHandler = {
  cardId: "lilting-lullaby",
};
