import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** When you play a card on an opponent's turn, play a 1 Might Recruit unit token to your base. */
export const viktorInnovator: SpecialCaseHandler = {
  cardId: "viktor-innovator",
  onAllyCardPlayed: (ctx) => {
    if (ctx.game.activePlayer === ctx.instance.controller) return;
    playTokenToBase(ctx.game, "token-recruit", ctx.instance.controller);
  },
};
