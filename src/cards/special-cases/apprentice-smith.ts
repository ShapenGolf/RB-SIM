import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** When I move, reveal the top card of your Main Deck. If it's a gear, draw it. Otherwise, recycle it. */
export const apprenticeSmith: SpecialCaseHandler = {
  cardId: "apprentice-smith",
  onMove: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const revealed = player.mainDeck.shift();
    if (!revealed) return;
    if (getCard(revealed).type === "gear") {
      player.hand.push(revealed);
    } else {
      player.mainDeck.push(revealed);
    }
  },
};
