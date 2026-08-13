import type { SpecialCaseHandler } from "./types";

/** Other friendly units have +1 Might here. */
export const garenCommander: SpecialCaseHandler = {
  cardId: "garen-commander",
  staticMightModifierForAlly: (ctx, ally) => {
    if (ctx.instance.battlefieldIndex === null) return 0;
    return ally.battlefieldIndex === ctx.instance.battlefieldIndex ? 1 : 0;
  },
};
