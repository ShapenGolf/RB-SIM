import type { SpecialCaseHandler } from "./types";

const REDUCTION = 2;
const MINIMUM_ENERGY = 1;

/** Spells with [Flow] you play from your trash cost 2 Energy less, to a minimum of 1 Energy. */
export const stargazer: SpecialCaseHandler = {
  cardId: "stargazer",
  flowCostReductionForController: (_ctx, flowEnergyCost) => Math.min(REDUCTION, Math.max(flowEnergyCost - MINIMUM_ENERGY, 0)),
};
