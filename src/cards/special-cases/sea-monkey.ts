import type { SpecialCaseHandler } from "./types";

/** You may pay 1 Energy as an additional cost to play me. When you play me, if you paid the additional cost, buff me. */
export const seaMonkey: SpecialCaseHandler = {
  cardId: "sea-monkey",
  additionalPlayCostEnergy: () => 1,
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    ctx.instance.statuses.buffed = true;
  },
};
