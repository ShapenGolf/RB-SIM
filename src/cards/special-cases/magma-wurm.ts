import type { SpecialCaseHandler } from "./types";

/** Other friendly units enter ready (instead of exhausted). */
export const magmaWurm: SpecialCaseHandler = {
  cardId: "magma-wurm",
  othersEnterReady: () => true,
};
