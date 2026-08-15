import { INVALID_MOVE } from "boardgame.io/core";
import type { MoveFn } from "boardgame.io";
import { getCard } from "../cards/db";
import { KeywordEngine } from "../keywords/registry";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { resolveCombat, destroyInstance } from "./combat";
import { createInstance, shuffle } from "./setup";
import { fireTemplatedEffect, runTemplatedActions } from "./templatedEffectEngine";
import { discardCardToTrash } from "./discardEngine";
import { attachEquipment } from "./equip";
import { legendPseudoInstance } from "./pseudoInstance";
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
  ambushBattlefieldIndex?: number,
): void {
  instance.statuses.paidAdditionalCostThisTurn = payAdditionalCost;
  if (card.type === "spell") {
    player.playedSpellThisTurn = true;
    if (player.nextSpellCostReduction > 0) player.nextSpellCostReduction = 0;
    KeywordEngine.fireOnPlay(G, card, instance);
    SpecialCaseEngine.onPlay(G, card, instance, targetInstanceId);
    fireTemplatedEffect(G, getCard, card, instance, "onPlay", targetInstanceId);
    if (player.nextSpellBonusDamage > 0) player.nextSpellBonusDamage = 0;
    delete G.instances[instance.instanceId];
    if (SpecialCaseEngine.banishSelfOnResolve(G, card, instance)) {
      player.banishment.push(instance.cardId);
    } else {
      player.trash.push(instance.cardId);
    }
  } else {
    const isUnit = card.type === "unit" || card.type === "champion";
    if (ambushBattlefieldIndex !== undefined) {
      instance.zone = "battlefield";
      instance.battlefieldIndex = ambushBattlefieldIndex;
      G.battlefields[ambushBattlefieldIndex].units[player.id].push(instance.instanceId);
    } else {
      player.base.push(instance.instanceId);
    }
    const entersReady =
      (payAdditionalCost && KeywordEngine.entersReadyIfCostPaid(G, card, instance)) ||
      SpecialCaseEngine.othersEnterReadyFor(G, getCard, instance) ||
      SpecialCaseEngine.selfEntersReady(G, card, instance) ||
      (isUnit && (player.nextUnitEntersReady || player.unitsEnterReadyThisTurn));
    if (isUnit && player.nextUnitEntersReady) player.nextUnitEntersReady = false;
    instance.exhausted = !entersReady;
    KeywordEngine.fireOnPlay(G, card, instance);
    SpecialCaseEngine.onPlay(G, card, instance, targetInstanceId);
    fireTemplatedEffect(G, getCard, card, instance, "onPlay", targetInstanceId);
  }

  player.playedMainDeckCardThisTurn = true;
  player.cardsPlayedThisTurn += 1;
  SpecialCaseEngine.onAllyCardPlayed(G, getCard, player.id, card, player.cardsPlayedThisTurn);
  SpecialCaseEngine.onEnemyCardPlayed(G, getCard, player.id, card, instance);
}

export interface PlayCardArgs {
  handIndex: number;
  energyRuneIds: string[];
  powerRuneIds: string[];
  payAdditionalCost?: boolean;
  targetInstanceId?: string;
  /** Play a unit/champion directly to this Battlefield instead of base — only legal with Ambush (see keywords/handlers/ambush.ts), and only onto a Battlefield where the controller already has a unit. */
  ambushBattlefieldIndex?: number;
}

export const playCard: MoveFn<GameState> = ({ G, playerID }, args: PlayCardArgs) => {
  const player = G.players[playerID as "0" | "1"];
  const cardId = player.hand[args.handIndex];
  if (!cardId) return INVALID_MOVE;

  const card = getCard(cardId);
  if (card.type === "rune" || card.type === "legend" || card.type === "battlefield") return INVALID_MOVE;

  const instance = createInstance(G, cardId, player.id);

  if (SpecialCaseEngine.blocksSelfPlay(G, card, instance)) return INVALID_MOVE;

  if (args.ambushBattlefieldIndex !== undefined) {
    if (card.type !== "unit" && card.type !== "champion") return INVALID_MOVE;
    const slot = G.battlefields[args.ambushBattlefieldIndex];
    if (!slot) return INVALID_MOVE;
    if (SpecialCaseEngine.blocksUnitsPlayedHere(G, getCard, args.ambushBattlefieldIndex, player.id))
      return INVALID_MOVE;
    // Champions may always choose a Battlefield destination, approximating the real Champion
    // Zone rules (see docs/rules-reference.md) this engine doesn't otherwise model. Units need
    // one of three specific permissions matching where they'd land: Ambush (own units already
    // there), an enemy-occupied grant (Deadbloom Predator), or an open-battlefield grant (Sai
    // Scout and friends) — see cards/special-cases/types.ts.
    if (card.type === "unit") {
      const enemyId = player.id === "0" ? "1" : "0";
      const ownOccupied = slot.units[player.id].length > 0;
      const enemyOccupied = slot.units[enemyId].length > 0;
      const isOpen = !ownOccupied && !enemyOccupied;
      const eligible =
        (ownOccupied && KeywordEngine.allowsPlayToOccupiedBattlefield(G, card, instance)) ||
        (enemyOccupied && SpecialCaseEngine.allowsPlayToEnemyOccupiedBattlefield(G, card, instance)) ||
        (enemyOccupied &&
          SpecialCaseEngine.allowsPlayToLoneEnemyBattlefield(
            G,
            getCard,
            card,
            instance,
            args.ambushBattlefieldIndex,
          )) ||
        (isOpen &&
          (SpecialCaseEngine.allowsPlayToOpenBattlefield(G, card, instance) ||
            SpecialCaseEngine.othersCanPlayToOpenBattlefield(G, getCard, instance)));
      if (!eligible) return INVALID_MOVE;
    }
  }

  const additionalEnergy = args.payAdditionalCost
    ? KeywordEngine.additionalPlayCostEnergy(G, card, instance) +
      (SpecialCaseEngine.additionalPlayCostEnergy(G, card, instance) ?? 0)
    : 0;
  const discardCostConfig = args.payAdditionalCost
    ? SpecialCaseEngine.additionalCostDiscardForReduction(card)
    : undefined;
  const canPayDiscardCost = Boolean(
    discardCostConfig && player.hand.length > discardCostConfig.discardCount,
  );
  const discardReduction = canPayDiscardCost ? discardCostConfig!.energyReduction : 0;
  const xpCostConfig = args.payAdditionalCost ? SpecialCaseEngine.additionalCostXPForReduction(card) : undefined;
  const canPayXPCost = Boolean(xpCostConfig && player.xp >= xpCostConfig.xpCost);
  const xpReduction = canPayXPCost ? xpCostConfig!.energyReduction : 0;
  const selfCostReduction = SpecialCaseEngine.costReduction(G, card, instance);
  const allyCostReduction = SpecialCaseEngine.costReductionFromAllies(G, getCard, instance, card);
  const nextSpellReduction = card.type === "spell" ? player.nextSpellCostReduction : 0;
  const energyNeeded = Math.max(
    0,
    (card.energyCost ?? 0) +
      additionalEnergy -
      discardReduction -
      xpReduction -
      selfCostReduction -
      allyCostReduction -
      nextSpellReduction,
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

  if (card.type === "spell") {
    player.maxEnergySpentOnSpellThisTurn = Math.max(player.maxEnergySpentOnSpellThisTurn, energyNeeded);
  }

  if (canPayDiscardCost) {
    for (let i = 0; i < discardCostConfig!.discardCount; i += 1) {
      const discarded = player.hand.shift();
      if (discarded) discardCardToTrash(G, getCard, player.id, discarded);
    }
  }
  if (canPayXPCost) player.xp -= xpCostConfig!.xpCost;

  resolvePlayedCard(
    G,
    player,
    card,
    instance,
    args.targetInstanceId,
    Boolean(args.payAdditionalCost),
    args.ambushBattlefieldIndex,
  );
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
    if (!instance || instance.controller !== player.id || instance.exhausted) return INVALID_MOVE;
    if (instance.statuses.cantMoveThisTurn) return INVALID_MOVE;
    const card = getCard(instance.cardId);
    if (card.type !== "unit" && card.type !== "champion") return INVALID_MOVE;
    const movingFromAnotherBattlefield =
      instance.zone === "battlefield" && instance.battlefieldIndex !== args.battlefieldIndex;
    const conditionalGanking = SpecialCaseEngine.hasConditionalGanking(G, card, instance);
    const hasGanking =
      conditionalGanking !== undefined
        ? conditionalGanking
        : KeywordEngine.hasKeyword(card, "ganking") ||
          instance.grantedThisTurn.some((k) => k.keyword === "ganking") ||
          SpecialCaseEngine.grantsGankingFromBattlefield(G, getCard, instance);
    if (instance.zone !== "base" && !(movingFromAnotherBattlefield && hasGanking)) {
      return INVALID_MOVE;
    }
  }

  for (const instanceId of args.unitInstanceIds) {
    const instance = G.instances[instanceId];
    if (instance.zone === "base") {
      player.base = player.base.filter((id) => id !== instanceId);
    } else if (instance.battlefieldIndex !== null) {
      const previousSlot = G.battlefields[instance.battlefieldIndex];
      previousSlot.units[player.id] = previousSlot.units[player.id].filter((id) => id !== instanceId);
    }
    instance.exhausted = true;
    instance.zone = "battlefield";
    instance.battlefieldIndex = args.battlefieldIndex;
    slot.units[player.id].push(instanceId);
  }

  for (const instanceId of args.unitInstanceIds) {
    const instance = G.instances[instanceId];
    const card = getCard(instance.cardId);
    fireTemplatedEffect(G, getCard, card, instance, "onAttack");
    SpecialCaseEngine.onAttack(G, card, instance);
    fireTemplatedEffect(G, getCard, card, instance, "onMove");
    SpecialCaseEngine.onMove(G, card, instance);
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
  if (player.trash.length < (cost.recycleFromTrash ?? 0)) return INVALID_MOVE;
  if (player.hand.length < (cost.discardCount ?? 0)) return INVALID_MOVE;
  if (instance.xp < (cost.spendXP ?? 0)) return INVALID_MOVE;
  if (cost.spendBuff && !instance.statuses.buffed) return INVALID_MOVE;

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
  if (cost.spendBuff) instance.statuses.buffed = false;
  for (let i = 0; i < (cost.recycleFromTrash ?? 0); i += 1) {
    const recycled = player.trash.shift();
    if (recycled) player.mainDeck.push(recycled);
  }
  for (let i = 0; i < (cost.discardCount ?? 0); i += 1) {
    const discarded = player.hand.shift();
    if (discarded) discardCardToTrash(G, getCard, player.id, discarded);
  }
  instance.xp -= cost.spendXP ?? 0;
  if (cost.killSelf) destroyInstance(G, getCard, instance.instanceId);

  if (card.activatedAbility) {
    runTemplatedActions(G, getCard, instance, card.activatedAbility.actions, args.targetInstanceId);
  } else {
    SpecialCaseEngine.onActivate(G, card, instance, args.targetInstanceId);
  }
  return undefined;
};

export interface EmpowerArgs {
  instanceId: string;
  energyRuneIds: string[];
  powerRuneId?: string;
}

/**
 * Pays a card's own "[Empower] [Cost]: Empower me/this." cost (see
 * cards/special-cases/types.ts SpecialCaseHandler.empowerCost) and sets the resulting status.
 * Mirrors activateAbility's cost validation/payment, minus the parts Empower never uses
 * (recycleFromTrash/spendBuff/killSelf/spendXP/target) — see keywords/handlers/empowered.ts for
 * the once-per-game constraint this enforces.
 */
export const empowerInstance: MoveFn<GameState> = ({ G, playerID }, args: EmpowerArgs) => {
  const player = G.players[playerID as "0" | "1"];
  const instance = G.instances[args.instanceId];
  if (!instance || instance.controller !== player.id) return INVALID_MOVE;
  if (instance.statuses.everEmpowered) return INVALID_MOVE;

  const card = getCard(instance.cardId);
  const cost = SpecialCaseEngine.empowerCost(G, card, instance);
  if (!cost) return INVALID_MOVE;
  if (cost.exhaustSelf && instance.exhausted) return INVALID_MOVE;
  if (args.energyRuneIds.length !== cost.energy) return INVALID_MOVE;
  if (Boolean(cost.runeDomain) !== Boolean(args.powerRuneId)) return INVALID_MOVE;
  if (player.hand.length < (cost.discardCount ?? 0)) return INVALID_MOVE;

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
  for (let i = 0; i < (cost.discardCount ?? 0); i += 1) {
    const discarded = player.hand.shift();
    if (discarded) discardCardToTrash(G, getCard, player.id, discarded);
  }

  instance.statuses.empowered = true;
  instance.statuses.everEmpowered = true;
  return undefined;
};

export interface ActivateLegendAbilityArgs {
  energyRuneIds: string[];
  powerRuneId?: string;
  targetInstanceId?: string;
}

/**
 * Activates the controller's Legend ability ("Cost, Exhaust: Effect"). Mirrors activateAbility,
 * but the Legend has no CardInstance of its own — see game/pseudoInstance.ts legendPseudoInstance
 * — so cost-paying mutates PlayerState.legend.exhausted directly instead of an instances[] entry.
 */
export const activateLegendAbility: MoveFn<GameState> = ({ G, playerID }, args: ActivateLegendAbilityArgs) => {
  const player = G.players[playerID as "0" | "1"];
  const legend = player.legend;
  if (!legend) return INVALID_MOVE;

  const card = getCard(legend.cardId);
  const instance = legendPseudoInstance(legend.cardId, player.id, legend.exhausted);
  const cost = card.activatedAbility?.cost ?? SpecialCaseEngine.activatedAbilityCost(card);
  if (!cost) return INVALID_MOVE;
  // A Legend has no persistent xp/buffed/instance to spend or kill — these cost components don't
  // apply here (no current Legend special case uses them; guarded rather than silently ignored).
  if (cost.spendXP || cost.killSelf || cost.spendBuff) return INVALID_MOVE;
  if (cost.exhaustSelf && legend.exhausted) return INVALID_MOVE;
  if (args.energyRuneIds.length !== cost.energy) return INVALID_MOVE;
  if (Boolean(cost.runeDomain) !== Boolean(args.powerRuneId)) return INVALID_MOVE;
  if (player.trash.length < (cost.recycleFromTrash ?? 0)) return INVALID_MOVE;
  if (player.hand.length < (cost.discardCount ?? 0)) return INVALID_MOVE;

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
  if (cost.exhaustSelf) legend.exhausted = true;
  for (let i = 0; i < (cost.recycleFromTrash ?? 0); i += 1) {
    const recycled = player.trash.shift();
    if (recycled) player.mainDeck.push(recycled);
  }
  for (let i = 0; i < (cost.discardCount ?? 0); i += 1) {
    const discarded = player.hand.shift();
    if (discarded) discardCardToTrash(G, getCard, player.id, discarded);
  }

  if (card.activatedAbility) {
    runTemplatedActions(G, getCard, instance, card.activatedAbility.actions, args.targetInstanceId);
  } else {
    SpecialCaseEngine.onActivate(G, card, instance, args.targetInstanceId);
  }
  return undefined;
};

export interface EquipGearArgs {
  gearInstanceId: string;
  targetInstanceId: string;
  energyRuneIds: string[];
  powerRuneId?: string;
}

/** Pays an Equipment gear's [Equip] cost and attaches it to a friendly unit/champion (see game/equip.ts). */
export const equipGear: MoveFn<GameState> = ({ G, playerID }, args: EquipGearArgs) => {
  const player = G.players[playerID as "0" | "1"];
  const gear = G.instances[args.gearInstanceId];
  if (!gear || gear.controller !== player.id) return INVALID_MOVE;
  const card = getCard(gear.cardId);
  const cost = card.equipCost;
  if (!cost) return INVALID_MOVE;

  const target = G.instances[args.targetInstanceId];
  if (!target || target.controller !== player.id) return INVALID_MOVE;
  const targetType = getCard(target.cardId).type;
  if (targetType !== "unit" && targetType !== "champion") return INVALID_MOVE;

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
    if (!rune || rune.exhausted || rune.domain !== cost.runeDomain) return INVALID_MOVE;
  }

  for (const runeId of args.energyRuneIds) {
    player.runePool.find((r) => r.instanceId === runeId)!.exhausted = true;
  }
  if (args.powerRuneId) {
    const idx = player.runePool.findIndex((r) => r.instanceId === args.powerRuneId);
    const [rune] = player.runePool.splice(idx, 1);
    player.runeDeck.push(rune);
  }

  attachEquipment(G, getCard, args.gearInstanceId, args.targetInstanceId);
  return undefined;
};

export interface ResolveOptionalCostArgs {
  pay: boolean;
  energyRuneIds: string[];
  powerRuneId?: string;
}

/** Resolves a pending "you may pay X to Y" reactive decision (see state.ts PendingOptionalCost). */
export const resolveOptionalCost: MoveFn<GameState> = ({ G, playerID }, args: ResolveOptionalCostArgs) => {
  const player = G.players[playerID as "0" | "1"];
  const pending = G.pendingOptionalCost;
  if (!pending || pending.playerId !== player.id) return INVALID_MOVE;

  if (!args.pay) {
    G.pendingOptionalCost = null;
    return undefined;
  }

  const cost = pending.cost;
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

  G.pendingOptionalCost = null;
  SpecialCaseEngine.onOptionalCostPaid(G, pending.specialCaseId, player.id, pending.payload);
  return undefined;
};

export interface ChooseBattlefieldArgs {
  cardId: string;
}

/**
 * Opening Battlefield pick (see game/game.ts's "battlefieldSelect" phase, which runs before
 * "mulligan" and must clear before turn 1 begins): each player brings 1 of their own 3
 * deck-submitted Battlefields to the shared table. Writes straight into the matching
 * `game.battlefields` slot (index 0 for player "0", index 1 for player "1" — see setup.ts).
 */
export const chooseBattlefield: MoveFn<GameState> = ({ G, playerID }, args: ChooseBattlefieldArgs) => {
  const id = playerID as "0" | "1";
  const player = G.players[id];
  if (player.chosenBattlefieldId) return INVALID_MOVE;
  if (!player.battlefieldPool.includes(args.cardId)) return INVALID_MOVE;
  player.chosenBattlefieldId = args.cardId;
  G.battlefields[Number(id)].cardId = args.cardId;
};

export interface MulliganArgs {
  /** 0-2 indices into the opening hand to shuffle back and replace with random new cards. */
  handIndices: number[];
}

/**
 * Opening-hand mulligan (see game/game.ts's "mulligan" phase, which both players must clear
 * before turn 1 begins): shuffles the chosen cards back into the Main Deck and draws the same
 * number of random replacements. Each player may only do this once, for up to 2 of their 4
 * starting cards.
 */
export const mulligan: MoveFn<GameState> = ({ G, playerID }, args: MulliganArgs) => {
  const player = G.players[playerID as "0" | "1"];
  if (player.mulliganDone) return INVALID_MOVE;
  const indices = [...new Set(args.handIndices)];
  if (indices.length > 2 || indices.some((i) => i < 0 || i >= player.hand.length)) return INVALID_MOVE;

  if (indices.length > 0) {
    const indexSet = new Set(indices);
    const kept = player.hand.filter((_, i) => !indexSet.has(i));
    const returned = player.hand.filter((_, i) => indexSet.has(i));
    const deck = shuffle([...player.mainDeck, ...returned]);
    const drawn = deck.splice(0, returned.length);
    player.hand = [...kept, ...drawn];
    player.mainDeck = deck;
  }
  player.mulliganDone = true;
};

export const endTurn: MoveFn<GameState> = ({ G, playerID, events }) => {
  const player = playerID as "0" | "1";
  for (const instance of Object.values(G.instances)) {
    if (instance.controller !== player) continue;
    SpecialCaseEngine.onEndOfTurn(G, getCard(instance.cardId), instance);
  }
  const playerState = G.players[player];
  const toReady = playerState.runePool.filter((r) => r.exhausted).slice(0, playerState.readyRunesAtEndOfTurn);
  for (const rune of toReady) rune.exhausted = false;
  playerState.readyRunesAtEndOfTurn = 0;
  events.endTurn();
};
