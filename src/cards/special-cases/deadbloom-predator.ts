import type { SpecialCaseHandler } from "./types";

/** [Deflect] You may play me to an occupied enemy battlefield. */
export const deadbloomPredator: SpecialCaseHandler = {
  cardId: "deadbloom-predator",
  allowsPlayToEnemyOccupiedBattlefield: () => true,
};
