import { INVALID_MOVE } from "boardgame.io/core";
import type { MoveFn } from "boardgame.io";
import { getCard } from "../cards/db";
import { KeywordEngine } from "../keywords/registry";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { resolveCombat } from "./combat";
import { createInstance } from "./setup";
import { fireTemplatedEffect, runTemplatedActions } from "./templatedEffectEngine";
import type { Card } from "../cards/types";
import type { CardInstance, GameState, PlayerState } from "./state";

/**
 * Shared post-payment resolution for a just-instantiated card: spells resolve immediately
 * to trash, units/champions/gear enter play (exhausted unless a hook says otherwise), then
 * both fire the same onPlay/broadcast hooks. Used by the normal hand-paid `playCard` move
 * and by "play it, ignoring its cost" effects (see game/playFree.ts) alike — callers are
 * responsible for removing/paying for the card beforehand.
 */
export function resolvePlayedCard(
  G: GameState,
  player: PlayerState,
  card: Card,
  instance: CardInstance,
  targetInstanceId: string | undefined,
  payAdditionalCost: boolean,
): void {
  if (card.type === "spell") {
    if (player.nextSpellCostReduction > 0) player.nextSpellCostReduction = 0;
    KeywordEngine.fireOnPlay(G, card, instance);
    SpecialCaseEngine.onPlay(G, card, instance, targetInstanceId);
    fireTemplatedEffect(G, getCard, card, instance, "onPlay", targetInstanceId);
    delete G.instances[instance.instanceId];
    player.trash.push(instance.cardId);
  } else {
    const isUnit = card.type === "unit" || card.type === "champion";
    const entersReady =
      (payAdditionalCost && KeywordEngine.entersReadyIfCostPaid(G, card, instance)) ||
      SpecialCaseEngine.othersEnterReadyFor(G, getCard, instance) ||
      (isUnit && player.nextUnitEntersReady);
    if (isUnit && player.nextUnitEntersReady) player.nextUnitEntersReady = false;
    instance.exhausted = !entersReady;
    player.base.push(instance.instanceId);
    KeywordEngine.fireOnPlay(G, card, instance);
    SpecialCaseEngine.onPlay(G, card, instance, targetInstanceId);
    fireTemplatedEffect(G, getCard, card, instance, "onPlay", targetInstanceId);
  }

  player.playedMainDeckCardThisTurn = true;
  player.cardsPlayedThisTurn += 1;
  SpecialCaseEngine.onAllyCardPlayed(G, getCard, player.id, card, player.cardsPlayedThisTurn);
}

export interface PlayCardArgs {
  handIndex: number;
  energyRuneIds: string[];
  powerRuneIds: string[];
  payAdditionalCost?: boolean;
  targetInstanceId?: string;
}

export const playCard: MoveFn<GameState> = ({ G, playerID }, args: PlayCardArgs) => {
  const player = G.players[playerID as "0" | "1"];
  const cardId = player.hand[args.handIndex];
  if (!cardId) return INVALID_MOVE;

  const card = getCard(cardId);
  if (card.type === "rune" || card.type === "legend" || card.type === "battlefield") return INVALID_MOVE;

  const instance = createInstance(G, cardId, player.id);

  const additionalEnergy = args.payAdditionalCost
    ? KeywordEngine.additionalPlayCostEnergy(G, card, instance)
    : 0;
  const discardCostConfig = args.payAdditionalCost
    ? SpecialCaseEngine.additionalCostDiscardForReduction(card)
    : undefined;
  const canPayDiscardCost = Boolean(
    discardCostConfig && player.hand.length > discardCostConfig.discardCount,
  );
  const discardReduction = canPayDiscardCost ? discardCostConfig!.energyReduction : 0;
  const selfCostReduction = SpecialCaseEngine.costReduction(G, card, instance);
  const nextSpellReduction = card.type === "spell" ? player.nextSpellCostReduction : 0;
  const energyNeeded = Math.max(
    0,
    (card.energyCost ?? 0) + additionalEnergy - discardReduction - selfCostReduction - nextSpellReduction,
  );
  if (args.energyRuneIds.length !== energyNeeded) return INVALID_MOVE;

  const usedRuneIds = new Set<string>();
  for (const runeId of args.energyRuneIds) {
    const rune = player.runePool.find((r) => r.instanceId === runeId);
    if (!rune || rune.exhausted || usedRuneIds.has(runeId)) return INVALID_MOVE;
    usedRuneIds.add(runeId);
  }
  for (const runeId of args.powerRuneIds) {
    if (usedRuneIds.has(runeId)) return INVALID_MOVE;
    const rune = player.runePool.find((r) => r.instanceId === runeId);
    if (!rune) return INVALID_MOVE;
    usedRuneIds.add(runeId);
  }

  const requiredByDomain = new Map<string, number>();
  for (const cost of card.powerCost) {
    requiredByDomain.set(cost.domain, (requiredByDomain.get(cost.domain) ?? 0) + cost.amount);
  }
  const suppliedByDomain = new Map<string, number>();
  for (const runeId of args.powerRuneIds) {
    const rune = player.runePool.find((r) => r.instanceId === runeId)!;
    suppliedByDomain.set(rune.domain, (suppliedByDomain.get(rune.domain) ?? 0) + 1);
  }
  for (const [domain, amount] of requiredByDomain) {
    if ((suppliedByDomain.get(domain) ?? 0) < amount) return INVALID_MOVE;
  }

  for (const runeId of args.energyRuneIds) {
    player.runePool.find((r) => r.instanceId === runeId)!.exhausted = true;
  }
  for (const runeId of args.powerRuneIds) {
    const idx = player.runePool.findIndex((r) => r.instanceId === runeId);
    const [rune] = player.runePool.splice(idx, 1);
    player.runeDeck.push(rune);
  }

  player.hand.splice(args.handIndex, 1);

  if (canPayDiscardCost) {
    for (let i = 0; i < discardCostConfig!.discardCount; i += 1) {
      const discarded = player.hand.shift();
      if (discarded) {
        player.trash.push(discarded);
        player.discardedCardThisTurn = true;
      }
    }
  }

  resolvePlayedCard(G, player, card, instance, args.targetInstanceId, Boolean(args.payAdditionalCost));
  return undefined;
};

export interface AttackBattlefieldArgs {
  battlefieldIndex: number;
  unitInstanceIds: string[];
}

export const attackBattlefield: MoveFn<GameState> = (
  { G, playerID },
  args: AttackBattlefieldArgs,
) => {
  const player = G.players[playerID as "0" | "1"];
  const slot = G.battlefields[args.battlefieldIndex];
  if (!slot || args.unitInstanceIds.length === 0) return INVALID_MOVE;

  for (const instanceId of args.unitInstanceIds) {
    const instance = G.instances[instanceId];
    if (!instance || instance.controller !== player.id) return INVALID_MOVE;
    if (instance.zone !== "base" || instance.exhausted) return INVALID_MOVE;
    const card = getCard(instance.cardId);
    if (card.type !== "unit" && card.type !== "champion") return INVALID_MOVE;
  }

  for (const instanceId of args.unitInstanceIds) {
    const instance = G.instances[instanceId];
    instance.exhausted = true;
    instance.zone = "battlefield";
    instance.battlefieldIndex = args.battlefieldIndex;
    player.base = player.base.filter((id) => id !== instanceId);
    slot.units[player.id].push(instanceId);
  }

  for (const instanceId of args.unitInstanceIds) {
    const instance = G.instances[instanceId];
    const card = getCard(instance.cardId);
    fireTemplatedEffect(G, getCard, card, instance, "onAttack");
    fireTemplatedEffect(G, getCard, card, instance, "onMove");
  }

  resolveCombat(G, getCard, args.battlefieldIndex, player.id);
  return undefined;
};

export interface ResolvePredictArgs {
  keepOnTop: boolean;
}

export const resolvePredict: MoveFn<GameState> = ({ G, playerID }, args: ResolvePredictArgs) => {
  const player = G.players[playerID as "0" | "1"];
  if (!player.pendingPredict) return INVALID_MOVE;
  if (!args.keepOnTop) {
    const top = player.mainDeck.shift();
    if (top) player.mainDeck.push(top);
  }
  player.pendingPredict = false;
  return undefined;
};

export interface ActivateAbilityArgs {
  instanceId: string;
  energyRuneIds: string[];
  powerRuneId?: string;
  targetInstanceId?: string;
}

export const activateAbility: MoveFn<GameState> = ({ G, playerID }, args: ActivateAbilityArgs) => {
  const player = G.players[playerID as "0" | "1"];
  const instance = G.instances[args.instanceId];
  if (!instance || instance.controller !== player.id) return INVALID_MOVE;

  const card = getCard(instance.cardId);
  // Data-driven (fixed-amount TemplatedActions) or bespoke (dynamic effect, e.g. "equal to my
  // Might") activated ability — see SpecialCaseHandler.activatedAbilityCost for the latter.
  const cost = card.activatedAbility?.cost ?? SpecialCaseEngine.activatedAbilityCost(card);
  if (!cost) return INVALID_MOVE;
  if (cost.exhaustSelf && instance.exhausted) return INVALID_MOVE;
  if (args.energyRuneIds.length !== cost.energy) return INVALID_MOVE;
  if (Boolean(cost.runeDomain) !== Boolean(args.powerRuneId)) return INVALID_MOVE;

  const seen = new Set<string>();
  for (const runeId of args.energyRuneIds) {
    const rune = player.runePool.find((r) => r.instanceId === runeId);
    if (!rune || rune.exhausted || seen.has(runeId)) return INVALID_MOVE;
    seen.add(runeId);
  }
  if (args.powerRuneId) {
    if (seen.has(args.powerRuneId)) return INVALID_MOVE;
    const rune = player.runePool.find((r) => r.instanceId === args.powerRuneId);
    if (!rune || rune.domain !== cost.runeDomain) return INVALID_MOVE;
  }

  for (const runeId of args.energyRuneIds) {
    player.runePool.find((r) => r.instanceId === runeId)!.exhausted = true;
  }
  if (args.powerRuneId) {
    const idx = player.runePool.findIndex((r) => r.instanceId === args.powerRuneId);
    const [rune] = player.runePool.splice(idx, 1);
    player.runeDeck.push(rune);
  }
  if (cost.exhaustSelf) instance.exhausted = true;

  if (card.activatedAbility) {
    runTemplatedActions(G, getCard, instance, card.activatedAbility.actions, args.targetInstanceId);
  } else {
    SpecialCaseEngine.onActivate(G, card, instance, args.targetInstanceId);
  }
  return undefined;
};

export const endTurn: MoveFn<GameState> = ({ events }) => {
  events.endTurn();
};
