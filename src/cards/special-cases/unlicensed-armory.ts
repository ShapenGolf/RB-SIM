import type { SpecialCaseHandler } from "./types";

/**
 * Discard 1, Exhaust: Choose a friendly unit. The next time it dies this turn, you may pay Fury
 * Rune to recall it exhausted instead. (Send it to base. This isn't a move.)
 *
 * Simplification: the Domain-Rune-only conditional cost is never charged (established
 * precedent, see crescent-guardian.ts) — always applies. Uses `preventNextDeathThisTurn`,
 * checked at the top of game/combat.ts destroyInstance.
 */
export const unlicensedArmory: SpecialCaseHandler = {
  cardId: "unlicensed-armory",
  activatedAbilityCost: { energy: 0, exhaustSelf: true, discardCount: 1 },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.statuses.preventNextDeathThisTurn = true;
  },
};
