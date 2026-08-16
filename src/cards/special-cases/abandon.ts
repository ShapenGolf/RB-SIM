import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell. Return it to its owner's hand instead of putting it in their trash.
 * [Predict].
 *
 * Moot — entirely gated behind Counter, which isn't wired up (deferred: this engine resolves
 * spells instantly, with no reactive response window to counter into — see docs/data-sourcing.md
 * and flurry-of-feathers.ts's identical note). No fallback mode to fall back on.
 */
export const abandon: SpecialCaseHandler = {
  cardId: "abandon",
};
