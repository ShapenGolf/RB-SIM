import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * You may pay Order Rune as an additional cost to play me. When you play me, if you paid the
 * additional cost, [Stun] an enemy unit at a battlefield.
 *
 * Simplification: the Domain-Rune additional cost is never charged (established precedent, see
 * crescent-guardian.ts).
 */
export const masaCrashingThunder: SpecialCaseHandler = {
  cardId: "masa-crashing-thunder",
  additionalPlayCostEnergy: () => 0,
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId || i.zone !== "battlefield") return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (target) target.statuses.stunned = true;
  },
};
