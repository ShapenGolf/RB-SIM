import type { SpecialCaseHandler } from "./types";
import { discardCardToTrash } from "../../game/discardEngine";
import { getCard } from "../db";

/** When you conquer here, discard 1, then draw 1. */
export const zaunWarrens: SpecialCaseHandler = {
  cardId: "zaun-warrens",
  onConquerHere: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const toDiscard = player.hand[0];
    if (toDiscard) {
      player.hand.shift();
      discardCardToTrash(ctx.game, getCard, ctx.instance.controller, toDiscard);
    }
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
