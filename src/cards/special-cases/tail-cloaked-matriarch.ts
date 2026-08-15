import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import type { SpecialCaseHandler } from "./types";

const MAX_ENERGY = 3;

/**
 * [Empower] 2 EnergyChaos Rune.
 * When I become [Empowered], you may choose a unit in your trash with Energy cost no more than
 * 3 Energy and Power cost no more than [X] Rune. Play it to your base, ignoring its cost.
 *
 * Known gap: the Power-cost (Rune) threshold on the trash unit was lost in text extraction
 * (bare "Rune", no number, same gap as spectral-matron.ts) — only the 3-Energy cap is enforced.
 * Simplification: always plays if eligible (no real downside — see docs/data-sourcing.md).
 */
export const tailCloakedMatriarch: SpecialCaseHandler = {
  cardId: "tail-cloaked-matriarch",
  empowerCost: { energy: 2, runeDomain: "Chaos" },
  onBecomeEmpowered: (ctx) => {
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
