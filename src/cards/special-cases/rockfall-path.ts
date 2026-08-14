import type { SpecialCaseHandler } from "./types";

/** Units can't be played here. */
export const rockfallPath: SpecialCaseHandler = {
  cardId: "rockfall-path",
  blocksUnitsPlayedHere: () => true,
};
