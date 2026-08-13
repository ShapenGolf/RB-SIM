import type { SpecialCaseHandler } from "./types";

/** You may play me to an open battlefield. */
export const sneakyDeckhand: SpecialCaseHandler = {
  cardId: "sneaky-deckhand",
  allowsPlayToOpenBattlefield: () => true,
};
