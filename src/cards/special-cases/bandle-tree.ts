import type { SpecialCaseHandler } from "./types";

/** You may hide an additional card here. */
export const bandleTree: SpecialCaseHandler = {
  cardId: "bandle-tree",
  allowsExtraHiddenCardHere: () => true,
};
