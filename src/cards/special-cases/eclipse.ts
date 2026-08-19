import type { SpecialCaseHandler } from "./types";

const MIGHT_PENALTY = 4;

/** [Reaction] Give a unit -4 Might this turn. [Predict]. */
export const eclipse: SpecialCaseHandler = {
  cardId: "eclipse",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    ctx.game.players[ctx.instance.controller].pendingPredict = 1;
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.tempMightBonus -= MIGHT_PENALTY;
  },
};
