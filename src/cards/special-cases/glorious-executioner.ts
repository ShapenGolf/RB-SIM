import type { SpecialCaseHandler } from "./types";

/** When you win a combat, draw 1. (You win if only your units remain after combat.) */
export const gloriousExecutioner: SpecialCaseHandler = {
  cardId: "glorious-executioner",
  onWinCombat: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
