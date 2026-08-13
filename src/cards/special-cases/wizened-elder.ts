import type { SpecialCaseHandler } from "./types";

/** While I'm buffed, I have an additional +1 Might (on top of the standard Buff bonus already applied in might.ts). */
export const wizenedElder: SpecialCaseHandler = {
  cardId: "wizened-elder",
  staticMightModifier: (ctx) => (ctx.instance.statuses.buffed ? 1 : 0),
};
