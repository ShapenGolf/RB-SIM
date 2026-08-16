import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, choose an opponent. They reveal their hand. Choose a card revealed this way
 * and banish it. When they hold, return it to their hand (even if I'm no longer on the board).
 *
 * Moot — "return it when they hold, even after I leave play" needs new PLAYER-level persistent
 * state (tracking which specific banished card to return, independent of this instance's own
 * lifetime) — a bigger addition than a small chokepoint fix for one card (deferred, see
 * docs/data-sourcing.md). Hand-reveal itself is a no-op in a non-hidden-information engine. No
 * fallback mode.
 */
export const asheFocused: SpecialCaseHandler = {
  cardId: "ashe-focused",
};
