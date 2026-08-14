import type { SpecialCaseHandler } from "./types";
import { applyStun } from "./stun";
import { getCard } from "../db";

/**
 * If you play me to a battlefield, I enter ready.
 * [Action] 1 Energy+Rune, Exhaust: [Stun] an enemy unit attacking here.
 *
 * Simplification: the printed cost's Rune component doesn't specify a Domain in the imported
 * data ("1 EnergyRune") — only the Energy part is charged, same precedent as the Accelerate
 * keyword (see cards/special-cases/types.ts `additionalPlayCostEnergy`).
 */
export const shadow: SpecialCaseHandler = {
  cardId: "shadow",
  selfEntersReady: (ctx) => ctx.instance.zone === "battlefield",
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    if (target.battlefieldIndex !== ctx.instance.battlefieldIndex) return;
    applyStun(ctx.game, getCard, target, ctx.instance.controller);
  },
};
