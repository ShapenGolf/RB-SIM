import type { SpecialCaseHandler } from "./types";

/**
 * When you conquer here, you may pay 1 Energy to ready your legend.
 *
 * Simplification: always readies for free (this engine has no live Energy-payment flow at a
 * passive Battlefield trigger point — see docs/data-sourcing.md).
 */
export const hallOfLegends: SpecialCaseHandler = {
  cardId: "hall-of-legends",
  onConquerHere: (ctx) => {
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (legend) legend.exhausted = false;
  },
};
