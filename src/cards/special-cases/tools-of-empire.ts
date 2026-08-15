import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 2 Energy (2 Energy: Empower this. Use only if not Empowered.)
 * Exhaust: Give a unit +2 Might this turn. If this is [Empowered], give that unit +4 Might this
 * turn instead.
 */
export const toolsOfEmpire: SpecialCaseHandler = {
  cardId: "tools-of-empire",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.tempMightBonus += ctx.instance.statuses.empowered ? 4 : 2;
  },
};
