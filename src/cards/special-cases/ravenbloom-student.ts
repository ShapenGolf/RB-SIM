import type { SpecialCaseHandler } from "./types";

/** When you play a spell, give me +1 Might this turn. */
export const ravenbloomStudent: SpecialCaseHandler = {
  cardId: "ravenbloom-student",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type === "spell") ctx.instance.tempMightBonus += 1;
  },
};
