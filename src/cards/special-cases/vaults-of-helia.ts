import type { SpecialCaseHandler } from "./types";

/**
 * When you hold here, your non-token units cost 1 Energy more to play this turn.
 *
 * "Non-token" is implicit: this hook only fires from game/moves.ts playCard's hand-paid cost
 * formula, which token units never go through (see docs precedent on resolvePlayedCard). See
 * costIncreaseForControllerUnit's doc comment (types.ts) for the "while held" simplification.
 */
export const vaultsOfHelia: SpecialCaseHandler = {
  cardId: "vaults-of-helia",
  costIncreaseForControllerUnit: (_ctx, playedCard) => (playedCard.type === "unit" || playedCard.type === "champion" ? 1 : 0),
};
