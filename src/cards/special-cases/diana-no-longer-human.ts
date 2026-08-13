import type { SpecialCaseHandler } from "./types";

/** When you play a spell, give me +2 Might this turn. Shared by the Unleashed and Vendetta printings. */
export const dianaNoLongerHuman: SpecialCaseHandler = {
  cardId: "diana-no-longer-human",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type === "spell") ctx.instance.tempMightBonus += 2;
  },
};
