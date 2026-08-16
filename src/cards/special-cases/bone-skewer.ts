import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] (Hide now for Rune to react with later for 0 Energy.)
 * Choose a battlefield. An opponent reveals their hand. You may choose a card... (banish/discard
 * effect gated on the reveal).
 *
 * Moot — [Hidden]/facedown state isn't modeled (deferred, see mushroom-pouch.ts's identical
 * note). No fallback mode.
 */
export const boneSkewer: SpecialCaseHandler = {
  cardId: "bone-skewer",
};
