import type { SpecialCaseHandler } from "./types";

/** [Vision] Other friendly units have [Vision]. */
export const gemcraftSeer: SpecialCaseHandler = {
  cardId: "gemcraft-seer",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.id === ctx.card.id) return; // "other" units only (approximate self-exclusion by card identity)
    if (playedCard.type !== "unit" && playedCard.type !== "champion") return;
    ctx.game.players[ctx.instance.controller].pendingPredict = 1;
  },
};
