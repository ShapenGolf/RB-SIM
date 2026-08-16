import type { SpecialCaseHandler } from "./types";

/**
 * If you've gained XP this turn, I have +1 Might and [Ganking]. (I can move from battlefield to
 * battlefield.)
 *
 * Moot — this engine has no "gained XP this turn" tracking; player.xp is mutated directly at
 * ~14 scattered call sites with no shared chokepoint to hook a per-turn flag into (deferred, see
 * docs/data-sourcing.md). No fallback mode.
 */
export const wilyNewtfish: SpecialCaseHandler = {
  cardId: "wily-newtfish",
};
