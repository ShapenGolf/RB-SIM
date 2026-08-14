import type { SpecialCaseHandler } from "./types";

const MIGHT_PENALTY = 4;

/**
 * [Reaction] Give a unit -4 Might this turn. [Predict].
 *
 * Only the Might penalty is implemented — [Predict] (look at the top card, may recycle it) has
 * no generic handler yet (see docs/rules-reference.md), so it's a documented gap here rather
 * than gating the rest of the card.
 */
export const eclipse: SpecialCaseHandler = {
  cardId: "eclipse",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.tempMightBonus -= MIGHT_PENALTY;
  },
};
