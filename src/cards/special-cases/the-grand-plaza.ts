import type { SpecialCaseHandler } from "./types";

/** When you hold here, if you have 7+ units here, you win the game. */
export const theGrandPlaza: SpecialCaseHandler = {
  cardId: "the-grand-plaza",
  onBeginningWhileHeld: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    if (slot.units[ctx.instance.controller].length >= 7) {
      ctx.game.winner = ctx.instance.controller;
    }
  },
};
