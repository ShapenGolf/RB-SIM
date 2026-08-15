import type { SpecialCaseHandler } from "./types";

/** While I'm at a battlefield, players only channel 1 rune at the start of their Channel Phase. */
export const sandstoneChimera: SpecialCaseHandler = {
  cardId: "sandstone-chimera",
  channelAmountCap: (ctx) => (ctx.instance.zone === "battlefield" ? 1 : Number.POSITIVE_INFINITY),
};
