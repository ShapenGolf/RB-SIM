import type { SpecialCaseHandler } from "./types";

const REDUCTION = 2;

/**
 * When you play your first card each turn, if I'm at a battlefield, your next card costs 2
 * Energy less.
 */
export const astralHeron: SpecialCaseHandler = {
  cardId: "astral-heron",
  onAllyCardPlayed: (ctx, _playedCard, playCountThisTurn) => {
    if (playCountThisTurn !== 1) return;
    if (ctx.instance.zone !== "battlefield") return;
    ctx.game.players[ctx.instance.controller].nextCardCostReduction = REDUCTION;
  },
};
