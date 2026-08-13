import type { SpecialCaseHandler } from "./types";

/** Units you control have +1 Might while attacking. */
export const tacticalBanner: SpecialCaseHandler = {
  cardId: "tactical-banner",
  attackingMightBonusForAlly: (ctx, allyInstance) =>
    allyInstance.controller === ctx.instance.controller ? 1 : 0,
};
