import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * You may spend 3 XP as an additional cost to play me.
 * When you play me, each player must kill one of their units. If you paid my additional cost,
 * you don't kill a unit this way.
 *
 * Simplification: no player choice of which unit each player kills — each kills their own
 * weakest unit (least value lost).
 */
export const safetyInspector: SpecialCaseHandler = {
  cardId: "safety-inspector",
  additionalCostXPForReduction: { xpCost: 3, energyReduction: 0 },
  onPlay: (ctx) => {
    for (const controller of ["0", "1"] as const) {
      if (controller === ctx.instance.controller && ctx.instance.statuses.paidAdditionalCostThisTurn) continue;
      let weakest: CardInstance | undefined;
      for (const instance of Object.values(ctx.game.instances)) {
        if (instance.controller !== controller) continue;
        const t = getCard(instance.cardId).type;
        if (t !== "unit" && t !== "champion") continue;
        if (!weakest || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, weakest, "none")) {
          weakest = instance;
        }
      }
      if (weakest) destroyInstance(ctx.game, getCard, weakest.instanceId);
    }
  },
};
