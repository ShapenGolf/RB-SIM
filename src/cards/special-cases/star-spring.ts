import type { SpecialCaseHandler } from "./types";

/**
 * The first time a player plays a non-token unit here each turn, they may move another unit
 * they control here to its base.
 *
 * Moot — "the first time...each turn" needs new persistent per-turn state on the Battlefield
 * itself (BattlefieldSlot has no per-turn-reset fields; game/turnFlow.ts's reset loop is
 * per-player-instance, not per-battlefield) — not a small chokepoint fix for one card (deferred,
 * see docs/data-sourcing.md). The new onCardPlayedHere broadcast (see valley-of-idols.ts) covers
 * the "played here" detection half but not the once-per-turn gate. No fallback mode.
 */
export const starSpring: SpecialCaseHandler = {
  cardId: "star-spring",
};
