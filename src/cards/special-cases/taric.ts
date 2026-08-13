import type { SpecialCaseHandler } from "./types";

/** [Shield] [Tank] Other friendly units here have Shield. (+1 Might while defending.) */
export const taric: SpecialCaseHandler = {
  cardId: "taric",
  defendingMightBonusForAlly: (ctx, ally) => {
    if (ally.controller !== ctx.instance.controller) return 0;
    if (ctx.instance.battlefieldIndex === null) return 0;
    return ally.battlefieldIndex === ctx.instance.battlefieldIndex ? 1 : 0;
  },
};
