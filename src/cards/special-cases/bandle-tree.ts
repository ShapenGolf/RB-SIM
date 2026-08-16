import type { SpecialCaseHandler } from "./types";

/**
 * You may hide an additional card here.
 *
 * Moot — [Hidden]/facedown state isn't modeled (deferred, see mushroom-pouch.ts's identical
 * note). No fallback mode.
 */
export const bandleTree: SpecialCaseHandler = {
  cardId: "bandle-tree",
};
