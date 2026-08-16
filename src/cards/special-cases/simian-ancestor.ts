import type { SpecialCaseHandler } from "./types";

/**
 * When you buff me, ready me.
 *
 * Moot — no "buffed" broadcast exists (deferred, see mistfall.ts's identical note). No fallback
 * mode.
 */
export const simianAncestor: SpecialCaseHandler = {
  cardId: "simian-ancestor",
};
