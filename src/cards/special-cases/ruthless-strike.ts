import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * [Action] As an additional cost to play this, you may discard 1.
 * Deal 3 to a unit at a battlefield. If you paid the additional cost, deal 5 to it instead.
 */
export const ruthlessStrike: SpecialCaseHandler = {
  cardId: "ruthless-strike",
  additionalCostDiscardForReduction: { discardCount: 1, energyReduction: 0 },
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield") return;
    const amount = ctx.instance.statuses.paidAdditionalCostThisTurn ? 5 : 3;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, amount, ctx.instance.controller);
  },
};
