import type { SpecialCaseHandler } from "./types";

/** Units can't move from here to base. */
export const vilemawsLair: SpecialCaseHandler = {
  cardId: "vilemaws-lair",
  blocksUnitsMovedToBaseFromHere: () => true,
};
