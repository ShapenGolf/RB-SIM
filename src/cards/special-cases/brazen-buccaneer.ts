import type { SpecialCaseHandler } from "./types";

/** As you play me, you may discard 1 as an additional cost. If you do, reduce my cost by 2 Energy. */
export const brazenBuccaneer: SpecialCaseHandler = {
  cardId: "brazen-buccaneer",
  additionalCostDiscardForReduction: { discardCount: 1, energyReduction: 2 },
};
