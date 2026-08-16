import type { SpecialCaseHandler } from "./types";

/**
 * When you hide a card, ready me.
 * When you play a card from face down, deal 2 to an enemy unit.
 *
 * Moot — [Hidden]/facedown state isn't modeled (deferred, see mushroom-pouch.ts's identical
 * note). No fallback mode.
 */
export const katarinaReckless: SpecialCaseHandler = {
  cardId: "katarina-reckless",
};
