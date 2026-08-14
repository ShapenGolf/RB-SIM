import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** When you defend here, reveal the top card of your Main Deck. If it's a spell, put it in your hand. Otherwise, recycle it. */
export const ravenbloomConservatory: SpecialCaseHandler = {
  cardId: "ravenbloom-conservatory",
  onDefendHere: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const revealed = player.mainDeck.shift();
    if (!revealed) return;
    if (getCard(revealed).type === "spell") {
      player.hand.push(revealed);
    } else {
      player.mainDeck.push(revealed);
    }
  },
};
