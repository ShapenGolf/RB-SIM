import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { discardCardToTrash } from "../../game/discardEngine";

/** [Deathknell] — Discard 2, then draw 2. */
export const undercoverAgent: SpecialCaseHandler = {
  cardId: "undercover-agent",
  onDestroy: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const discarded = controller.hand.shift();
      if (discarded) discardCardToTrash(ctx.game, getCard, ctx.instance.controller, discarded);
    }
    for (let i = 0; i < 2; i += 1) {
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    }
  },
};
