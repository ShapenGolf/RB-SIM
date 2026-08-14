import type { SpecialCaseHandler } from "./types";

/**
 * When you conquer here, draw 1 for each other battlefield you or allies control.
 *
 * Simplification: this is a 1v1 engine, so "or allies" never applies — only the controller's
 * own other Battlefields are counted.
 */
export const seatOfPower: SpecialCaseHandler = {
  cardId: "seat-of-power",
  onConquerHere: (ctx) => {
    const otherControlled = ctx.game.battlefields.filter(
      (b, i) => i !== ctx.instance.battlefieldIndex && b.controller === ctx.instance.controller,
    ).length;
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < otherControlled; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
