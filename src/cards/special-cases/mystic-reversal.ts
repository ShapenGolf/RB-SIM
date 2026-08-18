import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Gain control of a spell. You may make new choices for it.
 *
 * The [Reaction] response window now exists (see PendingSpellReaction), but this card isn't a
 * counter at all — it's a "steal and re-target a spell mid-resolution" effect, which is a
 * different, bigger mechanic this engine has no chokepoint for (a spell's caster/target are fixed
 * for its whole resolution — see moves.ts's resolvePlayedCard). Rebuttal's identical branch is
 * simplified away to a plain counter (see rebuttal.ts) for the same reason.
 */
export const mysticReversal: SpecialCaseHandler = {
  cardId: "mystic-reversal",
};
