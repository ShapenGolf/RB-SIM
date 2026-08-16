import type { SpecialCaseHandler } from "./types";

/**
 * While I'm in a showdown, your spells have [Repeat] 2 EnergyChaos Rune. (You may pay the
 * additional cost to repeat the spell's effect.)
 *
 * Moot — [Repeat] isn't modeled (deferred, see marai-spire.ts's identical note). No fallback
 * mode.
 */
export const syndraTranscendent: SpecialCaseHandler = {
  cardId: "syndra-transcendent",
};
