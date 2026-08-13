import type { SpecialCaseHandler } from "./types";

/** [Ganking] I enter ready. */
export const yiHoned: SpecialCaseHandler = {
  cardId: "yi-honed",
  selfEntersReady: () => true,
};
