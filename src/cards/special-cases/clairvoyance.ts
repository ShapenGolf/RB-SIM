import type { SpecialCaseHandler } from "./types";

const DRAW_AMOUNT = 2;

/**
 * [Reaction] [Predict 5]. (Look at the top 5 cards of your Main Deck. Recycle any of them and put
 * the rest back in any order.) Draw 2.
 *
 * [Predict 5] is approximated as a single Predict (the generic pendingPredict flag only models
 * looking at 1 card — see game/moves.ts resolvePredict), a documented gap matching eclipse.ts's
 * precedent for unmodeled Predict N. Reaction timing isn't modeled — resolves immediately.
 */
export const clairvoyance: SpecialCaseHandler = {
  cardId: "clairvoyance",
  onPlay: (ctx) => {
    ctx.game.players[ctx.instance.controller].pendingPredict = true;
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < DRAW_AMOUNT; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
