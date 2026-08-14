import type { SpecialCaseHandler } from "./types";

/** You may play me to an occupied enemy battlefield. */
export const dauntlessVanguard: SpecialCaseHandler = {
  cardId: "dauntless-vanguard",
  allowsPlayToEnemyOccupiedBattlefield: () => true,
};
