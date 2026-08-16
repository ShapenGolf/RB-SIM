import type { SpecialCaseHandler } from "./types";

/**
 * [Ambush] (You may play me as a [Reaction] to a battlefield where you have units.)
 * As an additional cost to play me, kill a Bird, Cat, Dog, or Poro you control. You may play me
 * to its battlefield (even if you don't have other units there).
 *
 * [Ambush] is a printed keyword, already generic. The additional cost is moot — this project's
 * `killFriendlyUnit` cost type has no tag filter (it always picks the controller's weakest OTHER
 * unit regardless of tags), so it can't express "must be a Bird/Cat/Dog/Poro" (deferred, see
 * docs/data-sourcing.md). No fallback mode for that clause.
 */
export const stalkingWolf: SpecialCaseHandler = {
  cardId: "stalking-wolf",
};
