import type { SpecialCaseHandler } from "./types";

/**
 * When you play a card from anywhere other than your hand, empower me.
 * [Action][>] Disempower me, Exhaust: Give a unit [Assault 2] this turn.
 *
 * Moot — the onAllyCardPlayed broadcast doesn't track which ZONE a card was played from (hand
 * vs. trash vs. elsewhere) — only that it was played; adding that would need new plumbing through
 * every "play a card" call site (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const heartOfTheTempest: SpecialCaseHandler = {
  cardId: "heart-of-the-tempest",
};
