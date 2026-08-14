import type { SpecialCaseHandler } from "./types";

/**
 * You may pay Mind Rune as an additional cost to play me. When you play me, if you paid the
 * additional cost, give a unit -2 Might this turn.
 *
 * Simplification: the additional cost is entirely a Domain Rune with no Energy component, so
 * (per the Accelerate-consistent simplification of only charging Energy — see
 * cards/special-cases/types.ts `additionalPlayCostEnergy`) it costs nothing extra here; the
 * "may" is still a real opt-in choice via the dedicated play button, just not resource-gated.
 * No player choice of which unit to weaken.
 */
export const frostcoatCub: SpecialCaseHandler = {
  cardId: "frostcoat-cub",
  additionalPlayCostEnergy: () => 0,
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    const target = Object.values(ctx.game.instances).find(
      (i) => i.instanceId !== ctx.instance.instanceId,
    );
    if (!target) return;
    target.tempMightBonus -= 2;
  },
};
