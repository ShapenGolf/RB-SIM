import type { SpecialCaseHandler } from "./types";

/**
 * Your Dragons' Energy costs are reduced by 2 Energy, to a minimum of 1 Energy.
 *
 * Simplification: the "to a minimum of 1" floor isn't separately modeled — see the identical
 * note on Leona (ogn-79) and docs/data-sourcing.md known simplifications.
 */
export const heraldOfScales: SpecialCaseHandler = {
  cardId: "herald-of-scales",
  costReductionForAlly: (_ctx, playedCard) => (playedCard.tags?.includes("Dragon") ? 2 : 0),
};
