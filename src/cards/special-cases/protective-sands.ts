import type { SpecialCaseHandler } from "./types";
import { SpecialCaseEngine } from "./registry";

/** When you conquer here, if you control 4 or fewer runes, you may pay 1 Energy to draw 1. */
export const protectiveSands: SpecialCaseHandler = {
  cardId: "protective-sands",
  onConquerHere: (ctx) => {
    if (ctx.game.pendingOptionalCost) return;
    const controller = ctx.instance.controller;
    if (ctx.game.players[controller].runePool.length > 4) return;
    SpecialCaseEngine.offerOptionalCost(ctx.game, controller, "protective-sands", { energy: 1 });
  },
  onOptionalCostPaid: (game, playerId) => {
    const player = game.players[playerId];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
