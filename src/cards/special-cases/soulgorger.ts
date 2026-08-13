import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";

/**
 * When you play me, you may play a unit from your trash, ignoring its Energy cost. (You must
 * still pay its Power cost.)
 *
 * Simplification: playCardIgnoringCost ignores the full cost, including Power (see
 * docs/data-sourcing.md) — a handful of cards across the set have this same "still pay Power"
 * carve-out, not modeled since the engine has no partial-cost-payment flow for a nested play.
 * No player choice of which unit (takes the first found in trash).
 */
export const soulgorger: SpecialCaseHandler = {
  cardId: "soulgorger",
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
