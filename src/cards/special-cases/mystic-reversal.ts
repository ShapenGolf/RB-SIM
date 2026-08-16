import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Gain control of a spell. You may make new choices for it.
 *
 * Moot — depends on the [Reaction] response window (deferred, see abandon.ts's identical note)
 * plus a "gain control of and re-target a spell mid-resolution" mechanic this engine has no
 * chokepoint for at all (spells resolve instantly and completely in a single call).
 */
export const mysticReversal: SpecialCaseHandler = {
  cardId: "mystic-reversal",
};
