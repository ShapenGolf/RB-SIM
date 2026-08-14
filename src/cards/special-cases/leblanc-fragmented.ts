import type { SpecialCaseHandler } from "./types";

/** [Assault] [Deathknell] — Draw 1. If it's your Beginning Phase, draw 2 instead. */
export const leblancFragmented: SpecialCaseHandler = {
  cardId: "leblanc-fragmented",
  onDestroy: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const count = ctx.game.turnPhase === "beginning" ? 2 : 1;
    for (let i = 0; i < count; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
