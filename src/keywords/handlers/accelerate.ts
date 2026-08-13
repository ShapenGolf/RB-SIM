import type { KeywordHandler } from "../types";

/**
 * Accelerate: "As you play me, you may pay [1][C] as an additional cost. If
 * you do, I enter ready." The `value` on the keyword instance is the extra
 * Energy amount (defaults to 1). Whether the option is taken is a player
 * decision resolved by the `playCard` move, not the engine itself.
 */
export const accelerateHandler: KeywordHandler = {
  name: "accelerate",
  additionalPlayCostEnergy: (ctx) => ctx.keyword.value ?? 1,
  entersReadyIfCostPaid: () => true,
};
