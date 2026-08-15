import type { SpecialCaseHandler } from "./types";

const SHIELD_BONUS = 1;

/** Units here with [Temporary] have [Shield]. (+1 Might while they're defenders.) */
export const blackFlameAltar: SpecialCaseHandler = {
  cardId: "black-flame-altar",
  defendingMightModifierForUnitsHere: (_ctx, targetInstance) => (targetInstance.statuses.temporary ? SHIELD_BONUS : 0),
};
