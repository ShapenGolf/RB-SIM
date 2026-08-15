import type { SpecialCaseHandler } from "./types";

/** If a player would score 1 point from conquering or holding during their first or second turn, they draw 1 instead. */
export const otterpus: SpecialCaseHandler = {
  cardId: "otterpus",
  convertsScoringToDrawOnEarlyTurns: () => true,
};
