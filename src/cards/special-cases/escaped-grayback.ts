import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] — Kill a friendly unit.
 * [Empowered][>] I have +2 Might.
 */
export const escapedGrayback: SpecialCaseHandler = {
  cardId: "escaped-grayback",
  empowerCost: { energy: 0, killFriendlyUnit: true },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 2 : 0),
};
