import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 2 Energy+Fury Rune (2 Energy+Fury Rune: Empower me. Use only if not Empowered.)
 * [Empowered] I have [Assault 3].
 * The generic keyword importer flattened this into an unconditional printed Assault 3 — there's
 * no override hook for Assault the way hasConditionalGanking exists for Ganking, so this cancels
 * the printed +3 while not Empowered instead. Simplification: this would also incorrectly cancel
 * any OTHER source's temporary Assault grant on this instance while not Empowered — an acceptably
 * narrow edge case (see docs/data-sourcing.md).
 */
export const shadowFiend: SpecialCaseHandler = {
  cardId: "shadow-fiend",
  attackingMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 0 : -3),
};
