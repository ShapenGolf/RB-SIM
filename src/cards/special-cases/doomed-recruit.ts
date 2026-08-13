import type { SpecialCaseHandler } from "./types";

/** Deathknell — Draw a card. */
export const doomedRecruit: SpecialCaseHandler = {
  cardId: "doomed-recruit-deathknell",
  onDestroy: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
