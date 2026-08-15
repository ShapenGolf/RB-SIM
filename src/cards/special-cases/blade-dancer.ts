import type { SpecialCaseHandler } from "./types";

/**
 * When you choose a friendly unit, you may exhaust me and pay Rune to ready it.
 * When you conquer, you may pay 1 Energy to ready me.
 *
 * Known gap: the "when you choose a friendly unit" clause isn't modeled (no onChosen broadcast
 * hook — see docs/data-sourcing.md). Simplification: the conquer-triggered self-ready always
 * fires for free (this engine has no live Energy-payment flow at a passive trigger point).
 */
export const bladeDancer: SpecialCaseHandler = {
  cardId: "blade-dancer",
  onConquer: (ctx) => {
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (legend) legend.exhausted = false;
  },
};
