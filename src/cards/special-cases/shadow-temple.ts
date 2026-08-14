import type { SpecialCaseHandler } from "./types";

const BURN_COUNT = 3;

/** When you hold here, [Burn 3]. (Put the top 3 cards of your Main Deck into your trash.) */
export const shadowTemple: SpecialCaseHandler = {
  cardId: "shadow-temple",
  onBeginningWhileHeld: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < BURN_COUNT; i += 1) {
      const burned = player.mainDeck.shift();
      if (burned) player.trash.push(burned);
    }
  },
};
