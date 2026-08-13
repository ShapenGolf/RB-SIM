import type { SpecialCaseHandler } from "./types";

/**
 * When you discard one or more cards, ready me and give me +1 Might this turn.
 *
 * Simplification: onAllyDiscard fires once per discarded card, not once per discard action —
 * a single effect that discards multiple cards at once (e.g. "discard 2") re-triggers this
 * once per card rather than once for the whole batch. Minor overcount, not worth a batching
 * mechanism for this one card.
 */
export const jinxRebel: SpecialCaseHandler = {
  cardId: "jinx-rebel",
  onAllyDiscard: (ctx) => {
    ctx.instance.exhausted = false;
    ctx.instance.tempMightBonus += 1;
  },
};
