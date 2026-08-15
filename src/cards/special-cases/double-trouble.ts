import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const LOOK_AMOUNT = 3;

/**
 * [Repeat] 2 Energy (You may pay the additional cost to repeat this spell's effect.) Look at the
 * top 3 cards of your Main Deck. You may reveal a unit from among them and draw it. Recycle the
 * rest.
 *
 * [Repeat] isn't wired up (~24 occurrences, deliberately not built — see docs/data-sourcing.md)
 * — only the base single resolution is implemented.
 */
export const doubleTrouble: SpecialCaseHandler = {
  cardId: "double-trouble",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const looked = player.mainDeck.splice(0, LOOK_AMOUNT);
    const unitIdx = looked.findIndex((id) => {
      const t = getCard(id).type;
      return t === "unit" || t === "champion";
    });
    if (unitIdx !== -1) {
      const [unit] = looked.splice(unitIdx, 1);
      player.hand.push(unit);
    }
    for (const cardId of looked) player.mainDeck.push(cardId);
  },
};
