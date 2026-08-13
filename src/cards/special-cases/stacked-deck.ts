import type { SpecialCaseHandler } from "./types";

/**
 * Look at the top 3 cards of your Main Deck. Put 1 into your hand and recycle the rest.
 *
 * Simplification: no player choice of which card (see docs/data-sourcing.md) — takes the top
 * card into hand, recycles the next two to the bottom of the deck.
 */
export const stackedDeck: SpecialCaseHandler = {
  cardId: "stacked-deck",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const top = controller.mainDeck.shift();
    if (top) controller.hand.push(top);
    for (let i = 0; i < 2; i += 1) {
      const rest = controller.mainDeck.shift();
      if (rest) controller.mainDeck.push(rest);
    }
  },
};
