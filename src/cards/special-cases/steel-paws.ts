import type { SpecialCaseHandler } from "./types";

/**
 * [Deflect] [Empower] 7 Energy (7 Energy: Empower me. Use only if not Empowered.)
 * [Empowered] I have +7 Might.
 */
export const steelPaws: SpecialCaseHandler = {
  cardId: "steel-paws",
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 7 : 0),
};
