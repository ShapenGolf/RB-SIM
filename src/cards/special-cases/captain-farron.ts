import type { SpecialCaseHandler } from "./types";

/** Other friendly units here have Assault. (+1 Might while they're attackers.) */
export const captainFarron: SpecialCaseHandler = {
  cardId: "captain-farron",
  attackingMightBonusForAlly: (ctx, allyInstance) => {
    if (allyInstance.controller !== ctx.instance.controller) return 0;
    if (ctx.instance.battlefieldIndex === null) return 0;
    return allyInstance.battlefieldIndex === ctx.instance.battlefieldIndex ? 1 : 0;
  },
};
