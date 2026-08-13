import type { SpecialCaseHandler } from "./types";

/** I enter ready. */
export const vanguardAttendant: SpecialCaseHandler = {
  cardId: "vanguard-attendant",
  selfEntersReady: () => true,
};
