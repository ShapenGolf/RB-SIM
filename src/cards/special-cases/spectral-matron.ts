import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";

/**
 * When you play me, you may play a unit costing no more than 3 Energy and no more than [X] Rune
 * from your trash, ignoring its cost.
 *
 * Simplification: the exact Rune threshold was lost in text extraction (a bare "Rune" with no
 * number) — only the 3-Energy cap is enforced. See soulgorger.ts for the "still pay Power cost"
 * simplification shared with this card.
 */
export const spectralMatron: SpecialCaseHandler = {
  cardId: "spectral-matron",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const idx = controller.trash.findIndex((id) => {
      const card = getCard(id);
      if (card.type !== "unit" && card.type !== "champion") return false;
      return card.energyCost !== null && card.energyCost <= 3;
    });
    if (idx === -1) return;
    const [chosen] = controller.trash.splice(idx, 1);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
  },
};
