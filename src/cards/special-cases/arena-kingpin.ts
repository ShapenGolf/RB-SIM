import type { SpecialCaseHandler } from "./types";

/** I enter ready. / Exhaust: Give a unit +3 Might this turn. */
export const arenaKingpin: SpecialCaseHandler = {
  cardId: "arena-kingpin",
  selfEntersReady: () => true,
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (target) target.tempMightBonus += 3;
  },
};
