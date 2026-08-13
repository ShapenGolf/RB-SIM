import type { Card } from "../cards/types";
import type { RuneInstance } from "../game/state";
import { KeywordEngine } from "../keywords/registry";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { getCard } from "../cards/db";
import type { CardInstance, GameState } from "../game/state";

export interface AutoPayResult {
  energyRuneIds: string[];
  powerRuneIds: string[];
}

/**
 * Greedy payment picker for the demo UI: satisfies Power cost first (using
 * already-exhausted Runes preferentially, since recycling doesn't require a
 * ready Rune), then satisfies Energy cost from whatever ready Runes remain.
 * Returns null if the pool can't cover the cost.
 */
export function computeAutoPayment(
  game: GameState,
  card: Card,
  instance: CardInstance,
  runePool: RuneInstance[],
  payAdditionalCost: boolean,
): AutoPayResult | null {
  const used = new Set<string>();
  const powerRuneIds: string[] = [];

  for (const cost of card.powerCost) {
    const candidates = runePool
      .filter((r) => r.domain === cost.domain && !used.has(r.instanceId))
      .sort((a, b) => Number(b.exhausted) - Number(a.exhausted));
    if (candidates.length < cost.amount) return null;
    for (let i = 0; i < cost.amount; i += 1) {
      powerRuneIds.push(candidates[i].instanceId);
      used.add(candidates[i].instanceId);
    }
  }

  const additionalEnergy = payAdditionalCost
    ? KeywordEngine.additionalPlayCostEnergy(game, card, instance)
    : 0;
  const discardCostConfig = payAdditionalCost
    ? SpecialCaseEngine.additionalCostDiscardForReduction(card)
    : undefined;
  const hand = game.players[instance.controller]?.hand ?? [];
  const discardReduction =
    discardCostConfig && hand.length > discardCostConfig.discardCount
      ? discardCostConfig.energyReduction
      : 0;
  const selfCostReduction = SpecialCaseEngine.costReduction(game, card, instance);
  const energyNeeded = Math.max(
    0,
    (card.energyCost ?? 0) + additionalEnergy - discardReduction - selfCostReduction,
  );
  const readyCandidates = runePool.filter((r) => !r.exhausted && !used.has(r.instanceId));
  if (readyCandidates.length < energyNeeded) return null;
  const energyRuneIds = readyCandidates.slice(0, energyNeeded).map((r) => r.instanceId);

  return { energyRuneIds, powerRuneIds };
}

export { getCard };
