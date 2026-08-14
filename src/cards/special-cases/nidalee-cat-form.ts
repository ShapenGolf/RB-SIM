import type { SpecialCaseHandler } from "./types";

/** [Ambush] When I win a combat, draw 1. (I win if I remain after combat.) */
export const nidaleeCatForm: SpecialCaseHandler = {
  cardId: "nidalee-cat-form",
  onSurviveCombat: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
