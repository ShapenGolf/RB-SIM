import type { SpecialCaseHandler } from "./types";

/** [Deathknell] — Draw 1. */
export const watchfulSentry: SpecialCaseHandler = {
  cardId: "watchful-sentry",
  onDestroy: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
};
