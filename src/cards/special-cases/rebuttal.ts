import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Choose a spell with Energy cost no more than 4 Energy. You may pay Rune. If you do, gain
 * control of it and you may make new choices for it. Otherwise, counter it.
 *
 * Moot — depends on the [Reaction] response window and Counter (deferred, see abandon.ts's
 * identical note), plus spell-hijacking (see mystic-reversal.ts's identical note).
 */
export const rebuttal: SpecialCaseHandler = {
  cardId: "rebuttal",
};
