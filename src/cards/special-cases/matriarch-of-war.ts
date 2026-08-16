import type { SpecialCaseHandler } from "./types";

/**
 * When you empower something else, empower me. (I become Empowered if I'm not already.)
 * Disempower me, Rune, Exhaust: Ready a unit.
 *
 * Moot — "when you empower something else, empower me" (a chain-trigger broadcast to OTHER
 * instances when any card is empowered) was deliberately evaluated and skipped earlier this
 * session: it needs a whole new onAllyBecomeEmpowered broadcast plus Legend-Empower support to
 * be fully correct, judged too large relative to payoff (see session history). No fallback mode.
 */
export const matriarchOfWar: SpecialCaseHandler = {
  cardId: "matriarch-of-war",
};
