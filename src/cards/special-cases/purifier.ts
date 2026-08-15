import type { SpecialCaseHandler } from "./types";

/** Your Equipment each give [Assault]. (+1 Might while equipped unit is an attacker.) */
export const purifier: SpecialCaseHandler = {
  cardId: "purifier",
  attackingMightBonusForAlly: (ctx, allyInstance) => {
    if (allyInstance.controller !== ctx.instance.controller) return 0;
    // "Each" — every attached Equipment contributes its own +1 Might while attacking.
    return allyInstance.equipment.length;
  },
};
