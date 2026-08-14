import type { SpecialCaseHandler } from "./types";

/** Draw 2. [Level 6] This costs 2 Energy less. [Level 11] This costs 4 Energy less instead. */
export const concentrate: SpecialCaseHandler = {
  cardId: "concentrate",
  costReduction: (ctx) => {
    const xp = ctx.game.players[ctx.instance.controller].xp;
    if (xp >= 11) return 4;
    if (xp >= 6) return 2;
    return 0;
  },
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
