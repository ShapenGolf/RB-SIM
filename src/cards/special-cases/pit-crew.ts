import type { SpecialCaseHandler } from "./types";

/** When you play a gear, ready me. */
export const pitCrew: SpecialCaseHandler = {
  cardId: "pit-crew",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type === "gear") ctx.instance.exhausted = false;
  },
};
