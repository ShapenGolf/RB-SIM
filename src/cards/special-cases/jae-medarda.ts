import type { SpecialCaseHandler } from "./types";

/** When you choose me with a spell, draw 1. "You" is the chooser — draws for them, not for Jae Medarda's own controller. */
export const jaeMedarda: SpecialCaseHandler = {
  cardId: "jae-medarda",
  onChosenAsTarget: (ctx, chooser, sourceCard) => {
    if (sourceCard.type !== "spell") return;
    const player = ctx.game.players[chooser];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
