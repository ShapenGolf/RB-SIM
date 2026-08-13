import type { SpecialCaseHandler } from "./types";

/** Channel 1 rune exhausted. If you can't, draw 1. */
export const mobilize: SpecialCaseHandler = {
  cardId: "mobilize",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const rune = controller.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      controller.runePool.push(rune);
    } else {
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    }
  },
};
