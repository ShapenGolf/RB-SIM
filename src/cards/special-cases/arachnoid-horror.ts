import type { SpecialCaseHandler } from "./types";

/**
 * [Hunt 2] (generic keyword, handled elsewhere.)
 * I can be played to an occupied battlefield if an enemy unit is alone there.
 * Friendly units can be played to an occupied battlefield if an enemy unit is alone there.
 */
export const arachnoidHorror: SpecialCaseHandler = {
  cardId: "arachnoid-horror",
  allowsPlayToLoneEnemyBattlefield: () => true,
  grantsOthersPlayToLoneEnemyBattlefield: () => true,
};
