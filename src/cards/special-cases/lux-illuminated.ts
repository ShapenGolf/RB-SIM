import type { SpecialCaseHandler } from "./types";

/** When you play a spell that costs 5 Energy or more, give me +3 Might this turn. */
export const luxIlluminated: SpecialCaseHandler = {
  cardId: "lux-illuminated",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type === "spell" && (playedCard.energyCost ?? 0) >= 5) {
      ctx.instance.tempMightBonus += 3;
    }
  },
};
