import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 3 Energy (3 Energy: Empower me.)
 * I can be [Empowered] up to three times.
 * I have +2 Might for each time I'm [Empowered].
 *
 * Moot — this engine's generic Empowered status is a once-per-game boolean (see
 * keywords/handlers/empowered.ts canBecomeEmpowered), not a stacking counter. Modeling "up to
 * three times" would need a new counter field replacing that boolean across every Empower-cost
 * card, not a small chokepoint fix (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const kayleJustified: SpecialCaseHandler = {
  cardId: "kayle-justified",
};
