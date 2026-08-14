import type { SpecialCaseHandler } from "./types";

/** When you play another unit, give me +2 Might this turn. */
export const reluctantLeader: SpecialCaseHandler = {
  cardId: "reluctant-leader",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.id === ctx.card.id) return; // "another" unit only (approximate self-exclusion by card identity)
    if (playedCard.type !== "unit" && playedCard.type !== "champion") return;
    ctx.instance.tempMightBonus += 2;
  },
};
