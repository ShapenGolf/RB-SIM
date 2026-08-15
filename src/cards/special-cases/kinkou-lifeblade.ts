import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 2 Energy (2 Energy: Empower me. Use only if not Empowered.)
 * [Empowered] I have +1 Might and [Ganking].
 * Same Empower-gated pattern as Brutal Hunter — the generic keyword importer flattened the
 * conditional Ganking into an unconditional printed keyword; `hasConditionalGanking` overrides it.
 */
export const kinkouLifeblade: SpecialCaseHandler = {
  cardId: "kinkou-lifeblade",
  empowerCost: { energy: 2 },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 1 : 0),
  hasConditionalGanking: (ctx) => Boolean(ctx.instance.statuses.empowered),
};
