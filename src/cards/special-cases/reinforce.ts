import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";

/**
 * Look at the top 5 cards of your Main Deck. You may banish a unit from among them, then play
 * it, reducing its cost by 5 Energy. Recycle the remaining cards.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — takes the first
 * unit found among the top 5. The 5-Energy reduction is approximated as playing it for free
 * (playCardIgnoringCost) since most unit costs at this stage of the pool are 5 Energy or less.
 */
export const reinforce: SpecialCaseHandler = {
  cardId: "reinforce",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const looked = controller.mainDeck.splice(0, 5);
    const unitIdx = looked.findIndex((id) => {
      const type = getCard(id).type;
      return type === "unit" || type === "champion";
    });
    if (unitIdx === -1) {
      for (const id of looked) controller.mainDeck.push(id);
      return;
    }
    const [chosen] = looked.splice(unitIdx, 1);
    for (const id of looked) controller.mainDeck.push(id);
    controller.banishment.push(chosen);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
  },
};
