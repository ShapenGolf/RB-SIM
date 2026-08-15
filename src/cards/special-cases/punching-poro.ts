import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] Discard 1 (Discard 1: Empower me. Use only if not Empowered.)
 * [Empowered] I have +1 Might.
 */
export const punchingPoro: SpecialCaseHandler = {
  cardId: "punching-poro",
  empowerCost: { energy: 0, discardCount: 1 },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 1 : 0),
};
