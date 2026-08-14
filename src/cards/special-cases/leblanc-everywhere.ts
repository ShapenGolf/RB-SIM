import type { SpecialCaseHandler } from "./types";

/** [Backline] Your [Temporary] effects at my battlefield don't trigger. */
export const leblancEverywhere: SpecialCaseHandler = {
  cardId: "leblanc-everywhere",
  preventsTemporaryDeath: (ctx, doomedInstance) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return false;
    return doomedInstance.battlefieldIndex === ctx.instance.battlefieldIndex;
  },
};
