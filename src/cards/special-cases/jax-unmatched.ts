import type { SpecialCaseHandler } from "./types";

/**
 * [Deflect] (Opponents must pay Rune to choose me with a spell or ability.)
 * Each Equipment in your hand has [Quick-Draw]. (It gains [Reaction]. When you play it, attach
 * it to a unit you control.)
 *
 * [Deflect] is a printed keyword, already generic (enforcement gap is the usual moot no-op, see
 * allay-eager-admirer.ts). Granting a new keyword to cards sitting in hand isn't modeled — hand
 * cards don't carry per-instance state to grant keywords onto (deferred, see
 * docs/data-sourcing.md). No fallback mode.
 */
export const jaxUnmatched: SpecialCaseHandler = {
  cardId: "jax-unmatched",
};
