import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * When you conquer here, you may spend a buff to draw 1.
 *
 * Simplification: always spends the first buffed friendly unit found (anywhere), since spending
 * it has no real downside here (see docs/data-sourcing.md "may" auto-resolve pattern).
 */
export const monasteryOfHirana: SpecialCaseHandler = {
  cardId: "monastery-of-hirana",
  onConquerHere: (ctx) => {
    const controller = ctx.instance.controller;
    const buffed = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== controller || !i.statuses.buffed) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (!buffed) return;
    buffed.statuses.buffed = false;
    const player = ctx.game.players[controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
