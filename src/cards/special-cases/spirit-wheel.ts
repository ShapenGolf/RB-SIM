import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";
import { SpecialCaseEngine } from "./registry";

/** When you choose a friendly unit, you may pay 1 Energy and exhaust this to draw 1. */
export const spiritWheel: SpecialCaseHandler = {
  cardId: "spirit-wheel",
  onAllyChosenAsTarget: (ctx, target) => {
    if (target.controller !== ctx.instance.controller) return; // must be friendly
    const targetCard = getCard(target.cardId);
    if (targetCard.type !== "unit" && targetCard.type !== "champion") return;
    if (ctx.instance.exhausted || ctx.game.pendingOptionalCost) return;
    SpecialCaseEngine.offerOptionalCost(ctx.game, ctx.instance.controller, "spirit-wheel", { energy: 1 }, ctx.instance.instanceId);
  },
  onOptionalCostPaid: (game, playerId, payload) => {
    if (!payload) return;
    const instance = game.instances[payload];
    if (instance) instance.exhausted = true;
    const player = game.players[playerId];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
