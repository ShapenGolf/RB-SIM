import type { SpecialCaseHandler } from "./types";

/**
 * Each spell that chooses one or more units here that are friendly to it costs Rune less.
 *
 * Moot — two separate blockers, not one. (1) costReductionIfTargeted (registry.ts) checks the
 * TARGET's own handler, not its Battlefield's — extending it to also do a battlefield-lookup
 * (the same idiom onChosenHere/onEnemyAttackHere already use) would be a small, well-precedented
 * change. But (2) is the real blocker: this is a bare "Rune less" — a Power/domain-rune cost
 * reduction, NOT an Energy reduction. Every cost-reduction pathway in this engine (costReduction,
 * costReductionFromAllies, costReductionIfTargeted, repeatCostReductionForController,
 * flowCostReductionForController, etc.) only ever subtracts from the Energy requirement; none of
 * them touch playCard's separate requiredByDomain/suppliedByDomain Power-cost validation. Irelia,
 * Graceful's "1 Energy or Rune less" sidesteps this by only ever charging the Energy alternative
 * (a documented simplification) — Sandswept Tomb has no Energy alternative to fall back on, so
 * that trick doesn't apply; implementing this "as Energy anyway" would be actively wrong, not
 * simplified. A real fix needs a genuine Power-cost reduction pathway, which doesn't exist yet
 * (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const sandsweptTomb: SpecialCaseHandler = {
  cardId: "sandswept-tomb",
};
