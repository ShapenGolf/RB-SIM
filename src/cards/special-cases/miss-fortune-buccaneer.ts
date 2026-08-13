import type { SpecialCaseHandler } from "./types";

/** You may play me to an open battlefield. Friendly units may be played to open battlefields. */
export const missFortuneBuccaneer: SpecialCaseHandler = {
  cardId: "miss-fortune-buccaneer",
  allowsPlayToOpenBattlefield: () => true,
  grantsOthersPlayToOpenBattlefield: () => true,
};
