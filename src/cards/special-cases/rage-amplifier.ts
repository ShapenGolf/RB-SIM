import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 6 Energy+Fury Rune (6 Energy+Fury Rune: Empower this. Use only if not Empowered.)
 * Your units have +1 Might. If I'm [Empowered], they have +2 Might instead.
 */
export const rageAmplifier: SpecialCaseHandler = {
  cardId: "rage-amplifier",
  empowerCost: { energy: 6, runeDomain: "Fury" },
  staticMightModifierForAlly: (ctx) => (ctx.instance.statuses.empowered ? 2 : 1),
};
