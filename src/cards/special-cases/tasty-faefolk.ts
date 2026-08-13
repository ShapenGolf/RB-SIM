import type { SpecialCaseHandler } from "./types";

/** [Accelerate] [Deathknell] — Channel 2 runes exhausted and draw 1. */
export const tastyFaefolk: SpecialCaseHandler = {
  cardId: "tasty-faefolk",
  onDestroy: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const rune = controller.runeDeck.shift();
      if (rune) {
        rune.exhausted = true;
        controller.runePool.push(rune);
      }
    }
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
};
