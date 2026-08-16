import type { SpecialCaseHandler } from "./types";

/**
 * [Ganking] (I can move from battlefield to battlefield.)
 * If I have moved twice this turn, I don't take damage.
 *
 * [Ganking] is a printed keyword, already generic. "Moved twice this turn" needs a per-instance
 * numeric move counter this engine doesn't track (only booleans/ThisTurn flags exist, not
 * counts) — deferred, see docs/data-sourcing.md. No fallback mode.
 */
export const kaynUnleashed: SpecialCaseHandler = {
  cardId: "kayn-unleashed",
};
