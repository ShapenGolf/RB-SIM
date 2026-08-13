import type { SpecialCaseHandler } from "./types";

/** Units you play this turn enter ready. Draw 1. */
export const confront: SpecialCaseHandler = {
  cardId: "confront",
  onPlay: (ctx) => {
    ctx.game.players[ctx.instance.controller].unitsEnterReadyThisTurn = true;
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
};
