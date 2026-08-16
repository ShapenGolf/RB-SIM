import type { SpecialCaseHandler } from "./types";

/**
 * [Temporary] (Kill this at the start of its controller's Beginning Phase, before scoring.)
 * Friendly units have [Deflect]. (Opponents must pay Rune to choose them with a spell or ability.)
 *
 * [Temporary] is a generic keyword already handled by the engine's Beginning Phase sweep — no
 * special-case code needed. The Deflect-grant is a no-op: Deflect's extraTargetingCost keyword
 * hook exists but nothing in the engine enforces it anywhere, for any card (see
 * allay-eager-admirer.ts's identical note).
 */
export const petriciteMonument: SpecialCaseHandler = {
  cardId: "petricite-monument",
};
