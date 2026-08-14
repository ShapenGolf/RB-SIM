import type { SpecialCaseHandler } from "./types";

/** Spend 3 XP: Give your units here [Ganking] this turn. */
export const megatusk: SpecialCaseHandler = {
  cardId: "megatusk",
  activatedAbilityCost: { energy: 0, exhaustSelf: false, spendXP: 3 },
  onActivate: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    for (const id of slot.units[ctx.instance.controller]) {
      ctx.game.instances[id].grantedThisTurn.push({ keyword: "ganking" });
    }
  },
};
