import type { SpecialCaseHandler } from "./types";

/** Empowered — While I have the Empowered status, I have +2 Might. */
export const empoweredChampionBonus: SpecialCaseHandler = {
  cardId: "empowered-champion-bonus",
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 2 : 0),
};
