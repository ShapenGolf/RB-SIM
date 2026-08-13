import type { SpecialCaseHandler } from "./types";

/** [Deathknell] — Channel 1 rune exhausted. */
export const soaringScout: SpecialCaseHandler = {
  cardId: "soaring-scout",
  onDestroy: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const rune = controller.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      controller.runePool.push(rune);
    }
  },
};
