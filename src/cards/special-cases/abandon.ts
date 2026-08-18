import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell. Return it to its owner's hand instead of putting it in their trash.
 * [Predict]. (Handled automatically by the generic `predict`/`vision` keyword handler, since
 * this card resolves through the normal onPlay pipeline regardless of the counter outcome.)
 */
export const abandon: SpecialCaseHandler = {
  cardId: "abandon",
  canCounterPending: () => true,
  counterDestination: "hand",
};
