import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { SpecialCaseHandler } from "./types";

/** When an enemy unit attacks a battlefield you control, give it -1 Might this turn, to a minimum of 1 Might. */
export const nineTailedFox: SpecialCaseHandler = {
  cardId: "nine-tailed-fox",
  onEnemyAttackHere: (ctx, attackingInstance) => {
    const currentMight = computeMight(ctx.game, getCard, attackingInstance, "none");
    if (currentMight <= 1) return;
    attackingInstance.tempMightBonus -= 1;
  },
};
