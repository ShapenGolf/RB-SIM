import type { SpecialCaseHandler } from "./types";

/** When you play a card with Power cost 2+ Rune or more, draw 1. */
export const yordleExplorer: SpecialCaseHandler = {
  cardId: "yordle-explorer",
  onAllyCardPlayed: (ctx, playedCard) => {
    const totalRunes = playedCard.powerCost.reduce((sum, p) => sum + p.amount, 0);
    if (totalRunes < 2) return;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
