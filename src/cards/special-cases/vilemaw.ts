import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

/** [Ambush] Enemy units here with less Might than me don't deal combat damage. When I hold, draw 1. */
export const vilemaw: SpecialCaseHandler = {
  cardId: "vilemaw",
  preventsCombatDamageForEnemy: (ctx, enemyInstance) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return false;
    if (enemyInstance.battlefieldIndex !== ctx.instance.battlefieldIndex) return false;
    const myMight = computeMight(ctx.game, getCard, ctx.instance, "none");
    const enemyMight = computeMight(ctx.game, getCard, enemyInstance, "none");
    return enemyMight < myMight;
  },
  onHold: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
