import type { SpecialCaseHandler } from "./types";

/**
 * While I'm in a showdown, your spells have [Repeat] 2 EnergyChaos Rune. (You may pay the
 * additional cost to repeat the spell's effect.)
 *
 * [Repeat] itself IS modeled now (rule 820 — see cards/db.ts Card.repeatCost, game/moves.ts
 * playCard's payRepeatCost flow). What's still missing is "while I'm in a showdown" — a
 * Showdown-scoped, self-location condition tied to attack/defend state rather than a simple "at
 * a battlefield" check — the same unmodeled primitive vex-cheerless.ts needs for its identical
 * "while I'm in combat" clause. Beyond that, granting [Repeat] DYNAMICALLY (rather than reading
 * a static Card.repeatCost) would also need the play-card UI to query board state for a hand
 * card BEFORE it's played, which the current repeatCost plumbing doesn't support (deferred, see
 * docs/data-sourcing.md). No fallback mode.
 */
export const syndraTranscendent: SpecialCaseHandler = {
  cardId: "syndra-transcendent",
};
