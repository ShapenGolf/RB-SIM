import type { SpecialCaseHandler } from "./types";
import { playTokenHere } from "./token-helpers";

/**
 * You may discard 1 as an additional cost to play me.
 * When you play me, if you paid the additional cost, play a 0 Might Shadow Clone unit token.
 */
export const zedFromTheShadows: SpecialCaseHandler = {
  cardId: "zed-from-the-shadows",
  additionalCostDiscardForReduction: { discardCount: 1, energyReduction: 0 },
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    playTokenHere(ctx.game, "token-shadow-clone", ctx.instance.controller, ctx.instance);
  },
};
