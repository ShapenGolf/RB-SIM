import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 3 Energy (3 Energy: Empower me. Use only if not Empowered.)
 * [Empowered] I have +2 Might and [Ganking]. (I can move from battlefield to battlefield.)
 * The generic keyword importer picked up "Ganking" as an unconditional printed keyword (it's
 * actually gated behind Empowered) — `hasConditionalGanking` here is the authoritative source and
 * overrides that (see game/moves.ts attackBattlefield: an explicit true/false from this hook wins
 * over the printed-keyword check either way).
 */
export const brutalHunter: SpecialCaseHandler = {
  cardId: "brutal-hunter",
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 2 : 0),
  hasConditionalGanking: (ctx) => Boolean(ctx.instance.statuses.empowered),
};
