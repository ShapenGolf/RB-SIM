import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, ready or exhaust a legend.
 * Simplification: only readies the controller's own Legend if it's exhausted — the "exhaust a
 * legend" branch (yours or an opponent's) is essentially never beneficial to choose voluntarily
 * with no stated upside, so it's not offered as a real choice (see docs/data-sourcing.md).
 */
export const royalEntourage: SpecialCaseHandler = {
  cardId: "royal-entourage",
  onPlay: (ctx) => {
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (legend && legend.exhausted) legend.exhausted = false;
  },
};
