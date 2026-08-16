import type { SpecialCaseHandler } from "./types";

/**
 * As you play this, name a tag. (For example, Miss Fortune, Demacia, and Poro are tags.)
 * Exhaust: Give a unit with the named tag -2 Might this turn.
 *
 * Moot — "name a tag" has no reasonable auto-pick heuristic (unlike Ivern, Friend to All's fixed
 * 4-tag choice — see ivern-friend-to-all.ts — here it's any of dozens of tags across the whole
 * card pool, with no way to know which one is "best" without seeing the opponent's board) and no
 * player-choice UI to ask (see docs/data-sourcing.md). No fallback mode.
 */
export const theList: SpecialCaseHandler = {
  cardId: "the-list",
};
