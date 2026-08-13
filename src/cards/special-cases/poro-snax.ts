import type { SpecialCaseHandler } from "./types";

/** When you play this, draw 1. / 1 Energy+Calm Rune, Exhaust, Kill this: Draw 1. */
export const poroSnax: SpecialCaseHandler = {
  cardId: "poro-snax",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
  activatedAbilityCost: { energy: 1, runeDomain: "Calm", exhaustSelf: true, killSelf: true },
  onActivate: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
