import type { SpecialCaseHandler } from "./types";

/** While you hold this Battlefield, draw a card at the start of your Beginning step. */
export const ancientRuins: SpecialCaseHandler = {
  cardId: "ancient-ruins",
  onBeginningWhileHeld: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
