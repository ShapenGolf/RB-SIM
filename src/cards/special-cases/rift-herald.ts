import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";

/**
 * When I move to a battlefield, look at the top 3 cards of your Main Deck. You may reveal a
 * unit from among them and draw it. Recycle the rest. / [Deathknell] — Play a unit from your
 * hand to your base, ignoring its Energy cost. (You must still pay its Power cost.)
 *
 * Simplification: no player choice of which unit either time; playCardIgnoringCost also ignores
 * Power cost, unlike the printed Deathknell text (see soulgorger.ts for the same
 * simplification).
 */
export const riftHerald: SpecialCaseHandler = {
  cardId: "rift-herald",
  onMove: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const looked = controller.mainDeck.splice(0, 3);
    const idx = looked.findIndex((id) => {
      const type = getCard(id).type;
      return type === "unit" || type === "champion";
    });
    if (idx === -1) {
      for (const id of looked) controller.mainDeck.push(id);
      return;
    }
    const [chosen] = looked.splice(idx, 1);
    controller.hand.push(chosen);
    for (const id of looked) controller.mainDeck.push(id);
  },
  onDestroy: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const idx = controller.hand.findIndex((id) => {
      const type = getCard(id).type;
      return type === "unit" || type === "champion";
    });
    if (idx === -1) return;
    const [chosen] = controller.hand.splice(idx, 1);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
  },
};
