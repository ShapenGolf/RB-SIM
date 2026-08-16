import type { SpecialCaseHandler } from "./types";

/**
 * When you buff a friendly unit, you may pay Body Rune and exhaust this to ready it.
 *
 * Moot — no "buffed" broadcast exists; buffing happens at ~15 scattered `statuses.buffed = true`
 * call sites with no shared chokepoint (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const mistfall: SpecialCaseHandler = {
  cardId: "mistfall",
};
