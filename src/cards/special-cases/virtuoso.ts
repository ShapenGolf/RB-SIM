import type { SpecialCaseHandler } from "./types";

/**
 * When you play a spell, if you spent 4 Energy or more, you may banish it. Then, if there are
 * four spells banished with me, put each into their owner's hand.
 *
 * Moot — tracking a per-instance list of "spells banished with me" (not just a count) would need
 * a new array field on CardInstance, touching all 4 factory sites (game/setup.ts,
 * game/pseudoInstance.ts x2, src/ui/Board.tsx) for a single card — not a small chokepoint fix
 * (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const virtuoso: SpecialCaseHandler = {
  cardId: "virtuoso",
};
