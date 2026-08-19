import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 2;

/** When I become ready, give me +2 Might this turn. */
export const fretfulFeline: SpecialCaseHandler = {
  cardId: "fretful-feline",
  onBecameReady: (ctx) => {
    ctx.instance.tempMightBonus += MIGHT_BONUS;
  },
};
