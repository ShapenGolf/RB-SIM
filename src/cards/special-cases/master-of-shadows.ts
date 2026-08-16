import type { SpecialCaseHandler } from "./types";

/**
 * When you banish a card you own, empower me.
 * [Action][>] Disempower me, Exhaust: Discard 1, then draw 1.
 *
 * Moot — "when you banish a card" has no shared chokepoint; banishing happens via both
 * banish-helpers.ts's banishInstance AND ~8 other direct `banishment.push` call sites with
 * inconsistent shapes (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const masterOfShadows: SpecialCaseHandler = {
  cardId: "master-of-shadows",
};
