import type { SpecialCaseHandler } from "./types";

/**
 * Each player looks at the top 5 cards of their Main Deck, chooses one, then recycles the rest.
 * Starting with the next player, each player plays those cards, ignoring Energy costs. (They
 * must still pay Power costs.)
 *
 * Moot — a multi-player sequenced pick-then-play chain, with partial (Power-only) cost payment
 * required, has no reasonable deterministic auto-resolution and no player-choice UI (deferred,
 * see docs/data-sourcing.md). No fallback mode.
 */
export const promisingFuture: SpecialCaseHandler = {
  cardId: "promising-future",
};
