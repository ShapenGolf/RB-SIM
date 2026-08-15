import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When you defend at a battlefield, you may move me there.
 *
 * Reuses onEnemyAttackHere — "an enemy attacks a battlefield you control" is exactly "you defend
 * at a battlefield." Simplification: the "may" always resolves yes (no real downside — see
 * docs/data-sourcing.md).
 */
export const loyalPup: SpecialCaseHandler = {
  cardId: "loyal-pup",
  onEnemyAttackHere: (ctx, attackingInstance) => {
    if (attackingInstance.battlefieldIndex === null) return;
    moveInstanceToBattlefield(ctx.game, ctx.instance.instanceId, attackingInstance.battlefieldIndex);
  },
};
