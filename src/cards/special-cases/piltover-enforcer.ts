import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const EXCESS_DAMAGE_THRESHOLD = 3;

/**
 * When you conquer, if you assigned 3 or more excess damage, you may exhaust me to ready a
 * unit.
 *
 * Simplification: always exhausts to ready if eligible and not already exhausted (no real
 * downside — see docs/data-sourcing.md); picks the controller's strongest exhausted friendly
 * unit.
 */
export const piltoverEnforcer: SpecialCaseHandler = {
  cardId: "piltover-enforcer",
  onConquer: (ctx, excessDamage) => {
    if (excessDamage < EXCESS_DAMAGE_THRESHOLD) return;
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (!legend || legend.exhausted) return;

    let best: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (!instance.exhausted) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!best || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, best, "none")) {
        best = instance;
      }
    }
    if (!best) return;
    legend.exhausted = true;
    best.exhausted = false;
  },
};
