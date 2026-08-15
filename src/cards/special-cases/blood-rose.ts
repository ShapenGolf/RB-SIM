import type { SpecialCaseHandler } from "./types";
import { SpecialCaseEngine } from "./registry";

const READY_COST_XP = 3;

/**
 * When you play a unit, you may pay 1 Energy to gain 1 XP. Spend 3 XP, Exhaust: Ready a unit.
 *
 * XP is tracked on Blood Rose's own CardInstance.xp (matching ActivatedAbilityCost.spendXP's
 * instance-scoped semantics — see moves.ts activateAbility), carried through the optional-cost
 * payload since onOptionalCostPaid has no live instance reference.
 */
export const bloodRose: SpecialCaseHandler = {
  cardId: "blood-rose",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type !== "unit" && playedCard.type !== "champion") return;
    if (ctx.game.pendingOptionalCost) return;
    SpecialCaseEngine.offerOptionalCost(ctx.game, ctx.instance.controller, "blood-rose", { energy: 1 }, ctx.instance.instanceId);
  },
  onOptionalCostPaid: (game, _playerId, payload) => {
    if (!payload) return;
    const instance = game.instances[payload];
    if (instance) instance.xp += 1;
  },
  activatedAbilityCost: { energy: 0, exhaustSelf: true, spendXP: READY_COST_XP },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.exhausted = false;
  },
};
