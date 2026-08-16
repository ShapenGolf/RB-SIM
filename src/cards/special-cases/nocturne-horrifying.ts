import type { SpecialCaseHandler } from "./types";

/**
 * [Ganking] (I can move from battlefield to battlefield.)
 * When you look at cards from the top of your deck (and don't draw them) and see me, you may
 * play me for Rune.
 *
 * [Ganking] is a printed keyword, already generic. The look-and-play trigger is moot — "looking
 * at top cards" happens at many independent look-N call sites (Predict, Vision, wild-claw-style
 * effects) with no shared chokepoint to check "is this specific card among them" from (deferred,
 * see docs/data-sourcing.md). No fallback mode for that clause.
 */
export const nocturneHorrifying: SpecialCaseHandler = {
  cardId: "nocturne-horrifying",
};
