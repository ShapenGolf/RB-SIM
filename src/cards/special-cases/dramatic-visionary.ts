import type { SpecialCaseHandler } from "./types";

/**
 * [Deathknell][>] [Predict 2]. (When I die, look at the top two cards of your Main Deck. Recycle
 * any of them and put the rest back in any order.)
 */
export const dramaticVisionary: SpecialCaseHandler = {
  cardId: "dramatic-visionary",
  onDestroy: (ctx) => {
    ctx.game.players[ctx.instance.controller].pendingPredict = 2;
  },
};
