import type { SpecialCaseHandler } from "./types";

/** I don't deal combat damage unless I'm at a battlefield with exactly one other unit you control. */
export const sacredProtector: SpecialCaseHandler = {
  cardId: "sacred-protector",
  preventsCombatDamage: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return true;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const allyCountIncludingSelf = slot.units[ctx.instance.controller].length;
    return allyCountIncludingSelf !== 2;
  },
};
