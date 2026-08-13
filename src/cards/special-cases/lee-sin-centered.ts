import type { SpecialCaseHandler } from "./types";

/** [Accelerate] Other buffed friendly units at my battlefield have +2 Might. */
export const leeSinCentered: SpecialCaseHandler = {
  cardId: "lee-sin-centered",
  staticMightModifierForAlly: (ctx, ally) => {
    if (!ally.statuses.buffed) return 0;
    if (ctx.instance.battlefieldIndex === null) return 0;
    return ally.battlefieldIndex === ctx.instance.battlefieldIndex ? 2 : 0;
  },
};
