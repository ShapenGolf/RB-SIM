import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Choose a spell with Energy cost no more than 4 Energy. You may pay Rune. If you do, gain
 * control of it and you may make new choices for it. Otherwise, counter it.
 *
 * Simplification: only the "counter it" branch is implemented — "gain control of it and make new
 * choices for it" would mean re-targeting and re-resolving a spell under this player's control
 * mid-flight, which this engine has no mechanism for at all (see mystic-reversal.ts's identical
 * gap). "Choose a spell" is implicitly the currently-pending one, same as riposte.ts.
 */
export const rebuttal: SpecialCaseHandler = {
  cardId: "rebuttal",
  canCounterPending: (_ctx, pending) => {
    const cost = getCard(pending.cardId).energyCost;
    return cost !== null && cost <= 4;
  },
};
