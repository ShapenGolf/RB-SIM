import type { SpecialCaseHandler } from "./types";

/** [Ambush] I can be played to a battlefield where there are enemy units (even if you don't have units there). */
export const rengarTrophyHunter: SpecialCaseHandler = {
  cardId: "rengar-trophy-hunter",
  allowsPlayToEnemyOccupiedBattlefield: () => true,
};
