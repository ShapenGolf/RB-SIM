import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * When I move, reveal the top card of your Main Deck. If it's a unit, draw it. Otherwise, put it
 * in your trash and give me +2 Might this turn.
 */
export const pakaaProtector: SpecialCaseHandler = {
  cardId: "pakaa-protector",
  onMove: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const topId = player.mainDeck.shift();
    if (!topId) return;
    if (getCard(topId).type === "unit") {
      player.hand.push(topId);
    } else {
      player.trash.push(topId);
      ctx.instance.tempMightBonus += 2;
    }
  },
};
