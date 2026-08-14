import type { SpecialCaseHandler } from "./types";

/** When another friendly unit dies, give me +2 Might this turn. */
export const spectralCentaur: SpecialCaseHandler = {
  cardId: "spectral-centaur",
  onAllyUnitDied: (ctx) => {
    ctx.instance.tempMightBonus += 2;
  },
};
