import type { SpecialCaseHandler } from "./types";

/**
 * Draw 1, then draw 1 for each battlefield you or allies control.
 *
 * Simplification: 1v1 engine, so "or allies" never applies.
 */
export const rightOfConquest: SpecialCaseHandler = {
  cardId: "right-of-conquest",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const controlled = ctx.game.battlefields.filter((b) => b.controller === ctx.instance.controller).length;
    for (let i = 0; i < 1 + controlled; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
