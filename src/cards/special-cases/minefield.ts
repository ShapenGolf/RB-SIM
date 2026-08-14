import type { SpecialCaseHandler } from "./types";

/** When you conquer here, put the top 2 cards of your Main Deck into your trash. */
export const minefield: SpecialCaseHandler = {
  cardId: "minefield",
  onConquerHere: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const card = player.mainDeck.shift();
      if (card) player.trash.push(card);
    }
  },
};
