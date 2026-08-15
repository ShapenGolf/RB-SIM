import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";

/**
 * [Deathknell] — You may play a unit with cost no more than 3 Energy and no more than [X] Rune
 * from your trash, ignoring its cost.
 *
 * Simplification: the exact Rune threshold was lost in text extraction (a bare "Rune" with no
 * number, same gap as spectral-matron.ts) — only the 3-Energy cap is enforced. Always plays if
 * eligible (no real downside — see docs/data-sourcing.md).
 */
export const glascMixologist: SpecialCaseHandler = {
  cardId: "glasc-mixologist",
  onDestroy: (ctx) => {
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
