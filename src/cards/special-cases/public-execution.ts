import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";

/**
 * Choose a friendly unit. Kill an enemy unit with less Might than it.
 * Simplification: no player choice of which friendly unit to compare against (see
 * docs/data-sourcing.md discard-choice simplification) — uses the controller's highest-Might
 * unit/champion in play. Flow isn't wired up yet.
 */
export const publicExecution: SpecialCaseHandler = {
  cardId: "public-execution",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    const targetType = getCard(target.cardId).type;
    if (targetType !== "unit" && targetType !== "champion") return;

    let bestMight = -1;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const type = getCard(instance.cardId).type;
      if (type !== "unit" && type !== "champion") continue;
      bestMight = Math.max(bestMight, computeMight(ctx.game, getCard, instance, "none"));
    }
    if (bestMight < 0) return;

    if (computeMight(ctx.game, getCard, target, "none") < bestMight) {
      destroyInstance(ctx.game, getCard, targetInstanceId);
    }
  },
};
