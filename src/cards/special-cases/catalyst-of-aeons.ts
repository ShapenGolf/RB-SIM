import type { SpecialCaseHandler } from "./types";

/** Channel 2 runes exhausted. If you couldn't channel 2 runes this way, draw 1. */
export const catalystOfAeons: SpecialCaseHandler = {
  cardId: "catalyst-of-aeons",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    let channeled = 0;
    for (let i = 0; i < 2; i += 1) {
      const rune = controller.runeDeck.shift();
      if (!rune) break;
      rune.exhausted = true;
      controller.runePool.push(rune);
      channeled += 1;
    }
    if (channeled < 2) {
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    }
  },
};
