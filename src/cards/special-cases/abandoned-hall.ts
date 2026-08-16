import type { SpecialCaseHandler } from "./types";

/**
 * When a player plays a spell, they may give a unit they control here +1 Might this turn.
 *
 * Moot — the new onCardPlayedHere broadcast (valley-of-idols.ts) only fires for units/gear
 * played directly to a battlefield (instance.battlefieldIndex set); spells never have a
 * battlefieldIndex (they resolve and are removed), so it can't detect "a player played a spell,
 * anywhere." Reaching every Battlefield for any spell play by either player would need a new,
 * broader broadcast (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const abandonedHall: SpecialCaseHandler = {
  cardId: "abandoned-hall",
};
