import type { SpecialCaseHandler } from "./types";

const XP_COST = 3;
const ENERGY_REDUCTION = 3;

/** You may spend 3 XP as an additional cost to play me. If you do, I cost 3 Energy less. [Ambush] [Tank] */
export const poppyDefenderOfTheMeek: SpecialCaseHandler = {
  cardId: "poppy-defender-of-the-meek",
  additionalCostXPForReduction: { xpCost: XP_COST, energyReduction: ENERGY_REDUCTION },
};
