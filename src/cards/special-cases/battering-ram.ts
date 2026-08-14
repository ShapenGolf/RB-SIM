import type { SpecialCaseHandler } from "./types";

/** I cost 1 Energy less for each card you've played this turn, to a minimum of 1 Energy. */
export const batteringRam: SpecialCaseHandler = {
  cardId: "battering-ram",
  costReduction: (ctx) => {
    const cost = ctx.card.energyCost ?? 0;
    const played = ctx.game.players[ctx.instance.controller].cardsPlayedThisTurn;
    return Math.min(played, Math.max(cost - 1, 0));
  },
};
