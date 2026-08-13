import type { SpecialCaseHandler } from "./types";

/** Units here have +1 Might. (This includes attackers.) */
export const trifarianWarCamp: SpecialCaseHandler = {
  cardId: "trifarian-war-camp",
  staticMightModifierForUnitsHere: () => 1,
};
