import type { SpecialCaseHandler } from "./types";

/** [Deflect] While I'm at a battlefield, opponents can't score points. */
export const tiannaCrownguard: SpecialCaseHandler = {
  cardId: "tianna-crownguard",
  blocksOpponentScoring: (ctx) => ctx.instance.zone === "battlefield",
};
