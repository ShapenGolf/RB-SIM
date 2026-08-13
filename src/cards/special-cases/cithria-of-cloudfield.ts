import type { SpecialCaseHandler } from "./types";

/** When you play another unit, buff me. */
export const cithriaOfCloudfield: SpecialCaseHandler = {
  cardId: "cithria-of-cloudfield",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.id === ctx.card.id) return; // "another" unit only (approximate self-exclusion by card identity)
    if (playedCard.type !== "unit" && playedCard.type !== "champion") return;
    ctx.instance.statuses.buffed = true;
  },
};
