import type { SpecialCaseHandler } from "./types";

/** [Vision] You may play me to an open battlefield. */
export const saiScout: SpecialCaseHandler = {
  cardId: "sai-scout",
  allowsPlayToOpenBattlefield: () => true,
};
