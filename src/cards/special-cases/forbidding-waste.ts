import type { SpecialCaseHandler } from "./types";

const ALONE_PENALTY = -2;

/** While a unit here is defending alone, it has -2 Might. (It's alone if there are no other friendly units here.) */
export const forbiddingWaste: SpecialCaseHandler = {
  cardId: "forbidding-waste",
  defendingMightModifierForUnitsHere: (ctx, targetInstance) => {
    if (targetInstance.battlefieldIndex === null) return 0;
    const slot = ctx.game.battlefields[targetInstance.battlefieldIndex];
    const alone = slot.units[targetInstance.controller].length === 1;
    return alone ? ALONE_PENALTY : 0;
  },
};
