import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 2;

/** [Vision] [Action] Kill this, Exhaust: Give a unit +2 Might this turn. */
export const diviningShells: SpecialCaseHandler = {
  cardId: "divining-shells",
  activatedAbilityCost: { energy: 0, exhaustSelf: false, killSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.tempMightBonus += MIGHT_BONUS;
  },
};
