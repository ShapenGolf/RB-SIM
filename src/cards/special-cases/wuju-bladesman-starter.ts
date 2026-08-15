import type { SpecialCaseHandler } from "./types";

/** While a friendly unit defends alone, it gets +2 Might. */
export const wujuBladesmanStarter: SpecialCaseHandler = {
  cardId: "wuju-bladesman-starter",
  defendingMightBonusForAlly: (ctx, allyInstance) => {
    if (allyInstance.controller !== ctx.instance.controller) return 0;
    if (allyInstance.battlefieldIndex === null) return 0;
    const slot = ctx.game.battlefields[allyInstance.battlefieldIndex];
    return slot.units[allyInstance.controller].length === 1 ? 2 : 0;
  },
};
