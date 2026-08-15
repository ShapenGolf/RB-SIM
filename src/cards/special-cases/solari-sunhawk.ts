import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 2 Energy (2 Energy: Empower me. Use only if not Empowered.)
 * [Empowered] I have +1 Might and [Deflect 2].
 * Deflect 2 stays printed/unconditional — same known gap as Serene Ascetic (no override hook for
 * a flawed unconditional printed Deflect, unlike Ganking's hasConditionalGanking).
 */
export const solariSunhawk: SpecialCaseHandler = {
  cardId: "solari-sunhawk",
  empowerCost: { energy: 2 },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 1 : 0),
};
