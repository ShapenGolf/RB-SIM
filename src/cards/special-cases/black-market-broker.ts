import type { SpecialCaseHandler } from "./types";

/**
 * When you play a card from face down, play a Gold gear token exhausted.
 *
 * Moot — [Hidden]/facedown state isn't modeled (deferred, see mushroom-pouch.ts's identical
 * note). No fallback mode.
 */
export const blackMarketBroker: SpecialCaseHandler = {
  cardId: "black-market-broker",
};
