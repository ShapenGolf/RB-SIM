import type { SpecialCaseHandler } from "./types";

const ENERGY_REDUCTION = 1;

/** While you control this battlefield, friendly [Repeat] costs cost 1 Energy less. */
export const maraiSpire: SpecialCaseHandler = {
  cardId: "marai-spire",
  repeatCostReductionForController: () => ENERGY_REDUCTION,
};
