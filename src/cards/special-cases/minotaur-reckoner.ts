import type { SpecialCaseHandler } from "./types";

/** Units can't move to base. (Ambient — applies to every unit while I'm in play.) */
export const minotaurReckoner: SpecialCaseHandler = {
  cardId: "minotaur-reckoner",
  preventsMoveToBase: () => true,
};
