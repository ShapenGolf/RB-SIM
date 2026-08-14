import type { SpecialCaseHandler } from "./types";

/** [Reaction] [Temporary] When an opponent scores, draw 1. */
export const sumpworksMap: SpecialCaseHandler = {
  cardId: "sumpworks-map",
  onOpponentScored: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
