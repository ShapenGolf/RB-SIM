import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";

/**
 * Play a unit from your trash, ignoring its Energy cost. (You must still pay its Power cost.)
 *
 * Simplification: see soulgorger.ts — playCardIgnoringCost ignores Power cost too.
 */
export const theHarrowing: SpecialCaseHandler = {
  cardId: "the-harrowing",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const idx = controller.trash.findIndex((id) => {
      const type = getCard(id).type;
      return type === "unit" || type === "champion";
    });
    if (idx === -1) return;
    const [chosen] = controller.trash.splice(idx, 1);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
  },
};
