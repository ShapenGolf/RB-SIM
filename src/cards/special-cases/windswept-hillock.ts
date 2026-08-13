import type { SpecialCaseHandler } from "./types";

/** Units here have [Ganking]. (They can move from battlefield to battlefield.) */
export const windsweptHillock: SpecialCaseHandler = {
  cardId: "windswept-hillock",
  grantsGankingToUnitsHere: () => true,
};
