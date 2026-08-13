import type { SpecialCaseHandler } from "./types";

/** [Deathknell] — Discard 2, then draw 2. */
export const undercoverAgent: SpecialCaseHandler = {
  cardId: "undercover-agent",
  onDestroy: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const discarded = controller.hand.shift();
      if (discarded) {
        controller.trash.push(discarded);
        controller.discardedCardThisTurn = true;
      }
    }
    for (let i = 0; i < 2; i += 1) {
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    }
  },
};
