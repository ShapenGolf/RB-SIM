import type { SpecialCaseHandler } from "./types";

/** I enter ready. */
export const eagerDrakehound: SpecialCaseHandler = {
  cardId: "eager-drakehound",
  selfEntersReady: () => true,
};
