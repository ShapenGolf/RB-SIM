import type { SpecialCaseHandler } from "./types";

/** [Ganking] Recycle 1 from your trash: Give me +1 Might this turn. */
export const viDestructive: SpecialCaseHandler = {
  cardId: "vi-destructive",
  activatedAbilityCost: { energy: 0, exhaustSelf: false, recycleFromTrash: 1 },
  onActivate: (ctx) => {
    ctx.instance.tempMightBonus += 1;
  },
};
