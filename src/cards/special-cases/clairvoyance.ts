import type { SpecialCaseHandler } from "./types";

const DRAW_AMOUNT = 2;

/**
 * [Reaction] [Predict 5]. (Look at the top 5 cards of your Main Deck. Recycle any of them and put
 * the rest back in any order.) Draw 2.
 *
 * As a [Reaction] SPELL, casting this already opens a real reaction window for the opponent (see
 * moves.ts's playCard/PendingSpellReaction) before it resolves — no extra work needed here.
 */
export const clairvoyance: SpecialCaseHandler = {
  cardId: "clairvoyance",
  onPlay: (ctx) => {
    ctx.game.players[ctx.instance.controller].pendingPredict = 5;
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < DRAW_AMOUNT; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
