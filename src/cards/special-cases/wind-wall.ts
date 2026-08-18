import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell.
 */
export const windWall: SpecialCaseHandler = {
  cardId: "wind-wall",
  canCounterPending: () => true,
};
