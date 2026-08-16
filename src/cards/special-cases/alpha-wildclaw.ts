import type { SpecialCaseHandler } from "./types";

/**
 * [Tank] (I must be assigned combat damage first.)
 * Your units here with less Might than me can't be chosen by enemy spells and abilities.
 *
 * [Tank] is a printed keyword, already generic. Target-immunity ("can't be chosen") isn't
 * modeled — spell/ability targeting in this engine doesn't run through a shared legality check
 * (deferred, see docs/data-sourcing.md). No fallback mode for the second clause.
 */
export const alphaWildclaw: SpecialCaseHandler = {
  cardId: "alpha-wildclaw",
};
