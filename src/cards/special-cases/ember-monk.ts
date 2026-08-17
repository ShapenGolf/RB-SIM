import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 2;

/** When you play a card from [Hidden], give me +2 Might this turn. */
export const emberMonk: SpecialCaseHandler = {
  cardId: "ember-monk",
  onAllyPlayFromHidden: (ctx) => {
    ctx.instance.tempMightBonus += MIGHT_BONUS;
  },
};
