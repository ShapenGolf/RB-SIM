import type { SpecialCaseHandler } from "./types";

/**
 * When you play a card from [Hidden], give me +2 Might this turn.
 *
 * Moot — [Hidden]/facedown state isn't modeled (deferred, see mushroom-pouch.ts's identical
 * note). No fallback mode.
 */
export const emberMonk: SpecialCaseHandler = {
  cardId: "ember-monk",
};
