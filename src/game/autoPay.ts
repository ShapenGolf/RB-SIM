import type { Card } from "../cards/types";
import { KeywordEngine } from "../keywords/registry";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { getCard } from "../cards/db";
import type { CardInstance, GameState, RuneInstance } from "./state";

export interface AutoPayResult {
  energyRuneIds: string[];
  powerRuneIds: string[];
}

export interface RequiredCost {
  energy: number;
  /** Per-domain Power requirement, already merged by domain (e.g. two "Fury Rune" cost entries become one {domain: "Fury", amount: 2}). */
  power: { domain: Card["domains"][number]; amount: number }[];
}

/**
 * Same cost-reduction math as computeAutoPayment, but returns the REQUIRED totals instead of a
 * specific rune selection — for the manual rune picker (see ui/Board.tsx), which needs to show
 * "X/N Energy chosen" and let the player pick which physical runes to spend themselves.
 */
export function computeRequiredCost(
  game: GameState,
  card: Card,
  instance: CardInstance,
  payAdditionalCost: boolean,
): RequiredCost {
  const powerByDomain = new Map<Card["domains"][number], number>();
  for (const cost of card.powerCost) {
    powerByDomain.set(cost.domain, (powerByDomain.get(cost.domain) ?? 0) + cost.amount);
  }

  const additionalEnergy = payAdditionalCost
    ? KeywordEngine.additionalPlayCostEnergy(game, card, instance) +
      (SpecialCaseEngine.additionalPlayCostEnergy(game, card, instance) ?? 0)
    : 0;
  const discardCostConfig = payAdditionalCost
    ? SpecialCaseEngine.additionalCostDiscardForReduction(card)
    : undefined;
  const hand = game.players[instance.controller]?.hand ?? [];
  const discardReduction =
    discardCostConfig && hand.length > discardCostConfig.discardCount ? discardCostConfig.energyReduction : 0;
  const selfCostReduction = SpecialCaseEngine.costReduction(game, card, instance);
  const allyCostReduction = SpecialCaseEngine.costReductionFromAllies(game, getCard, instance, card);
  const nextSpellReduction =
    card.type === "spell" ? (game.players[instance.controller]?.nextSpellCostReduction ?? 0) : 0;
  const energy = Math.max(
    0,
    (card.energyCost ?? 0) + additionalEnergy - discardReduction - selfCostReduction - allyCostReduction - nextSpellReduction,
  );

  return { energy, power: Array.from(powerByDomain, ([domain, amount]) => ({ domain, amount })) };
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
    ? KeywordEngine.additionalPlayCostEnergy(game, card, instance) +
      (SpecialCaseEngine.additionalPlayCostEnergy(game, card, instance) ?? 0)
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
  const allyCostReduction = SpecialCaseEngine.costReductionFromAllies(game, getCard, instance, card);
  const nextSpellReduction =
    card.type === "spell" ? (game.players[instance.controller]?.nextSpellCostReduction ?? 0) : 0;
  const energyNeeded = Math.max(
    0,
    (card.energyCost ?? 0) +
      additionalEnergy -
      discardReduction -
      selfCostReduction -
      allyCostReduction -
      nextSpellReduction,
  );
  const readyCandidates = runePool.filter((r) => !r.exhausted && !used.has(r.instanceId));
  if (readyCandidates.length < energyNeeded) return null;
  const energyRuneIds = readyCandidates.slice(0, energyNeeded).map((r) => r.instanceId);

  return { energyRuneIds, powerRuneIds };
}

export { getCard };
