import type { SpecialCaseHandler } from "./types";

/** Increase the points needed to win the game by 1. */
export const aspirantsClimb: SpecialCaseHandler = {
  cardId: "aspirants-climb",
  winScoreIncrease: () => 1,
};
