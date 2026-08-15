import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import type { SpecialCaseHandler } from "./types";

const MAX_ENERGY = 2;

/**
 * This costs 2 Energy less if you choose a Bird, Cat, Dog, or Poro.
 * Play a unit with cost no more than 2 Energy and no more than [X] Rune from your trash,
 * ignoring its cost.
 *
 * Known gap: the "costs 2 Energy less" self cost-reduction depends on which unit is about to be
 * chosen from trash, which this engine's costReduction hook (evaluated before the trash pick)
 * can't see — not modeled, so this spell is always paid at full cost (see
 * docs/data-sourcing.md). Rune threshold on the trash unit was lost in text extraction (bare
 * "Rune", no number, same gap as spectral-matron.ts) — only the 2-Energy cap is enforced.
 */
export const undyingLoyalty: SpecialCaseHandler = {
  cardId: "undying-loyalty",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const idx = controller.trash.findIndex((id) => {
      const card = getCard(id);
      if (card.type !== "unit" && card.type !== "champion") return false;
      return card.energyCost !== null && card.energyCost <= MAX_ENERGY;
    });
    if (idx === -1) return;
    const [chosen] = controller.trash.splice(idx, 1);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
  },
};
