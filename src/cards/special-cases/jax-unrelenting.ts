import type { SpecialCaseHandler } from "./types";
import { SpecialCaseEngine } from "./registry";

/** [Weaponmaster] When you attach an Equipment to me, you may pay 1 Energy to draw 1. */
export const jaxUnrelenting: SpecialCaseHandler = {
  cardId: "jax-unrelenting",
  onEquip: (ctx) => {
    if (ctx.game.pendingOptionalCost) return;
    SpecialCaseEngine.offerOptionalCost(ctx.game, ctx.instance.controller, "jax-unrelenting", { energy: 1 });
  },
  onOptionalCostPaid: (game, playerId) => {
    const player = game.players[playerId];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
