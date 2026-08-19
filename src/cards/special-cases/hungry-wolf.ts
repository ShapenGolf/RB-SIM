import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * Order Rune: Ready me and give me +1 Might this turn. Use only if you've chosen an enemy unit
 * this turn and only once each turn.
 */
export const hungryWolf: SpecialCaseHandler = {
  cardId: "hungry-wolf",
  onAllyChosenAsTarget: (ctx, target) => {
    if (target.controller === ctx.instance.controller) return; // must be an enemy, not friendly
    const targetCard = getCard(target.cardId);
    if (targetCard.type !== "unit" && targetCard.type !== "champion") return;
    ctx.game.players[ctx.instance.controller].chosenEnemyUnitThisTurn = true;
  },
  activatedAbilityCost: (ctx) => {
    if (ctx.instance.statuses.hungryWolfUsedThisTurn) return undefined;
    if (!ctx.game.players[ctx.instance.controller].chosenEnemyUnitThisTurn) return undefined;
    return { energy: 0, runeDomain: "Order", exhaustSelf: false };
  },
  onActivate: (ctx) => {
    readyInstance(ctx.game, getCard, ctx.instance.instanceId);
    ctx.instance.tempMightBonus += 1;
    ctx.instance.statuses.hungryWolfUsedThisTurn = true;
  },
};
