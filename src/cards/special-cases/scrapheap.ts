import type { SpecialCaseHandler } from "./types";

/** When this is played, discarded, or killed, draw 1. */
export const scrapheap: SpecialCaseHandler = {
  cardId: "scrapheap",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
  onDestroy: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
  onSelfDiscarded: (game, playerId) => {
    const controller = game.players[playerId];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
};
