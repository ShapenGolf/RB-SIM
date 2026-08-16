import type { SpecialCaseHandler } from "./types";

/**
 * When you conquer here, look at the top two cards of your Main Deck. You may recycle one or
 * both of them. Put those you don't back in any order.
 *
 * No player choice of which to recycle, and no heuristic exists for "worth burying" (see
 * docs/data-sourcing.md) — the only game-state-neutral default is recycling none, which has no
 * observable effect, so this registers as a documented no-op.
 */
export const candlelitSanctum: SpecialCaseHandler = {
  cardId: "candlelit-sanctum",
};
