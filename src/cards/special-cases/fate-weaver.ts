import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const MIN_ENERGY_COST = 4;

/**
 * When you play me, look at the top 4 cards of your Main Deck. You may reveal a spell with
 * Energy cost 4 Energy or more from among them and draw it. Recycle the rest.
 *
 * Simplification: no player choice of which spell (see docs/data-sourcing.md) — takes the
 * first eligible one found.
 */
export const fateWeaver: SpecialCaseHandler = {
  cardId: "fate-weaver",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const looked = controller.mainDeck.splice(0, 4);
    const idx = looked.findIndex((id) => {
      const card = getCard(id);
      return card.type === "spell" && card.energyCost !== null && card.energyCost >= MIN_ENERGY_COST;
    });
    if (idx === -1) {
      for (const id of looked) controller.mainDeck.push(id);
      return;
    }
    const [chosen] = looked.splice(idx, 1);
    controller.hand.push(chosen);
    for (const id of looked) controller.mainDeck.push(id);
  },
};
