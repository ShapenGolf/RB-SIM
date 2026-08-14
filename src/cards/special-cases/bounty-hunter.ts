import type { SpecialCaseHandler } from "./types";

/** Exhaust: Give a unit [Ganking] this turn. (It can move from battlefield to battlefield.) */
export const bountyHunter: SpecialCaseHandler = {
  cardId: "bounty-hunter",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.grantedThisTurn.push({ keyword: "ganking" });
  },
};
