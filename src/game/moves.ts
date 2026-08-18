import { INVALID_MOVE, Stage } from "boardgame.io/core";
import type { MoveFn } from "boardgame.io";
import { getCard } from "../cards/db";
import { KeywordEngine } from "../keywords/registry";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { resolveCombat, destroyInstance } from "./combat";
import { computeMight } from "./might";
import { createInstance, shuffle, buildPlayerFromDeckList } from "./setup";
import { fireTemplatedEffect, runTemplatedActions, candidatesForTarget } from "./templatedEffectEngine";
import { discardCardToTrash } from "./discardEngine";
import { attachEquipment } from "./equip";
import { legendPseudoInstance } from "./pseudoInstance";
import { validateDeck, type DeckList } from "../cards/deckValidation";
import { firstChooseTargetSpec } from "../cards/templatedEffects";
import type { Card } from "../cards/types";
import type { CardInstance, GameState, PlayerState, PlayerId, PendingSpellReaction } from "./state";

/**
 * Rejects a play/activation whose action list needs a player-chosen target but the move either
 * gave an illegal one, or skipped choosing when it shouldn't have — closes the "pay for a spell,
 * it silently resolves to nothing" gap (see docs/data-sourcing.md and the matching ui/Board.tsx
 * target-picker filtering). Only covers TemplatedAction-based target specs (auto-matched onPlay
 * effects and activated abilities); bespoke special-case handlers validate their own targets
 * separately (see SpecialCaseEngine.onChosen and each handler's onPlay/onActivate).
 *
 * `requiresTargetToExist` distinguishes two shapes of "mandatory" (non-`optional`) target:
 * - A spell's targeted action usually IS the entire spell (e.g. "Kill a gear.") — with zero legal
 *   candidates it simply can't be cast, same as real rules. Activating an ability is the same
 *   deliberate, cost-paying choice, so it gets the same treatment.
 * - A unit/champion/gear's onPlay trigger is a bonus on top of deploying the card (e.g. "When you
 *   play me, kill an enemy unit.") — it still enters play even if the trigger fizzles for lack of
 *   a target, same as it always has; only reject an explicit-but-illegal pick here.
 */
function rejectsInvalidTemplatedTarget(
  G: GameState,
  actions: import("../cards/templatedEffects").TemplatedAction[] | undefined,
  source: CardInstance,
  targetInstanceId: string | undefined,
  requiresTargetToExist: boolean,
): boolean {
  const spec = actions ? firstChooseTargetSpec(actions) : undefined;
  if (!spec) return false;
  const candidates = candidatesForTarget(G, getCard, source, spec);
  if (targetInstanceId) return !candidates.some((c) => c.instanceId === targetInstanceId);
  if (spec.optional) return false;
  if (candidates.length === 0) return requiresTargetToExist;
  return true; // Candidates exist and this target is mandatory — force an explicit pick.
}

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
  if (player.nextCardCostReduction > 0) player.nextCardCostReduction = 0;
  if (card.type === "spell") {
    player.playedSpellThisTurn = true;
    if (player.nextSpellCostReduction > 0) player.nextSpellCostReduction = 0;
    // "Choosing" happens at cast time, before the spell's own effect resolves — fire this first
    // so "when you choose X" triggers (e.g. Jae Medarda) still see the target even if the spell's
    // own effect goes on to destroy/move it.
    if (targetInstanceId) SpecialCaseEngine.onChosen(G, getCard, player.id, targetInstanceId, card);
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
    if (isUnit) player.playedNonTokenUnitThisTurn = true;
    if (card.type === "gear") player.playedNonTokenGearThisTurn = true;
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
    if (isUnit && player.buffUnitsPlayedThisTurn) instance.statuses.buffed = true;
    if (isUnit && player.nextUnitBuffed) {
      instance.statuses.buffed = true;
      player.nextUnitBuffed = false;
    }
    instance.exhausted = !entersReady;
    KeywordEngine.fireOnPlay(G, card, instance);
    SpecialCaseEngine.onPlay(G, card, instance, targetInstanceId);
    fireTemplatedEffect(G, getCard, card, instance, "onPlay", targetInstanceId);
  }

  player.playedMainDeckCardThisTurn = true;
  player.cardsPlayedThisTurn += 1;
  SpecialCaseEngine.onAllyCardPlayed(G, getCard, player.id, card, player.cardsPlayedThisTurn);
  SpecialCaseEngine.onEnemyCardPlayed(G, getCard, player.id, card, instance);
  if (instance.battlefieldIndex !== null) {
    SpecialCaseEngine.onCardPlayedHere(G, getCard, instance.battlefieldIndex, card, instance, player.id);
  }
}

function otherPlayerId(id: PlayerId): PlayerId {
  return id === "0" ? "1" : "0";
}

/**
 * True if `playerId` has at least one [Reaction]-keyword card in hand right now — used to decide
 * whether casting a spell should actually pause and open a reaction window (see
 * PendingSpellReaction) at all. Skipping the window entirely when the answer is "no" avoids
 * forcing an empty "Passen" click on every single spell cast — physically equivalent (a player
 * with nothing to respond with always passes), just without the UI busywork.
 */
function hasReactionCardInHand(G: GameState, playerId: PlayerId): boolean {
  return G.players[playerId].hand.some((cardId) => KeywordEngine.hasKeyword(getCard(cardId), "reaction"));
}

/**
 * Resolves — or, if countered, discards — the spell paused by an open reaction window, and closes
 * the window. Shared by playCard's "reacted with a counter-capable card" path and passReaction's
 * "declined to react" path.
 */
function settlePendingSpellReaction(
  G: GameState,
  pending: PendingSpellReaction,
  /** The reacting card's counterDestination (see SpecialCaseHandler) — undefined when not countered at all. */
  counterDestination: "trash" | "hand" | undefined,
): void {
  const card = getCard(pending.cardId);
  const casterPlayer = G.players[pending.casterId];
  const instance = G.instances[pending.instanceId];
  if (instance && counterDestination) {
    delete G.instances[pending.instanceId];
    if (counterDestination === "hand") {
      casterPlayer.hand.push(pending.cardId);
    } else {
      casterPlayer.trash.push(pending.cardId);
    }
  } else if (instance) {
    resolvePlayedCard(G, casterPlayer, card, instance, pending.targetInstanceId, pending.payAdditionalCost);
  }
  G.pendingSpellReaction = null;
}

/**
 * Battlefield indices a unit or champion may be played straight to from hand (bypassing Base),
 * shared by the `playCard` move's own validation and the hand-card UI's button list (Board.tsx)
 * so the two can never drift apart. Champions get no special carve-out here — like units, they
 * may only skip Base via an actual granted permission (Ambush, or a specific card's grant); the
 * normal path onto a Battlefield for both is Base, then `attackBattlefield`.
 */
export function eligibleAmbushBattlefields(G: GameState, card: Card, instance: CardInstance): number[] {
  if (card.type !== "unit" && card.type !== "champion") return [];
  const playerId = instance.controller;
  const enemyId = playerId === "0" ? "1" : "0";
  const eligible: number[] = [];
  G.battlefields.forEach((slot, index) => {
    const ownOccupied = slot.units[playerId].length > 0;
    const enemyOccupied = slot.units[enemyId].length > 0;
    const isOpen = !ownOccupied && !enemyOccupied;
    const allowed =
      (ownOccupied && KeywordEngine.allowsPlayToOccupiedBattlefield(G, card, instance)) ||
      (enemyOccupied && SpecialCaseEngine.allowsPlayToEnemyOccupiedBattlefield(G, card, instance)) ||
      (enemyOccupied && SpecialCaseEngine.allowsPlayToLoneEnemyBattlefield(G, getCard, card, instance, index)) ||
      (isOpen &&
        (SpecialCaseEngine.allowsPlayToOpenBattlefield(G, card, instance) ||
          SpecialCaseEngine.othersCanPlayToOpenBattlefield(G, getCard, instance)));
    if (allowed) eligible.push(index);
  });
  return eligible;
}

export interface PlayCardArgs {
  /** Required unless `fromChampionZone` is true. */
  handIndex?: number;
  /** Play the Chosen Champion from its own zone (see game/setup.ts, state.ts's `championZone`) instead of a hand card — same cost/target/ambush handling either way, just a different source and removal step. */
  fromChampionZone?: boolean;
  energyRuneIds: string[];
  powerRuneIds: string[];
  payAdditionalCost?: boolean;
  targetInstanceId?: string;
  /** Play a unit/champion directly to this Battlefield instead of base — only legal with Ambush (see keywords/handlers/ambush.ts), and only onto a Battlefield where the controller already has a unit. */
  ambushBattlefieldIndex?: number;
}

export const playCard: MoveFn<GameState> = ({ G, events, playerID }, args: PlayCardArgs) => {
  const player = G.players[playerID as "0" | "1"];
  // A spell reaction window is open — see PendingSpellReaction. The caster themselves is never
  // allowed to act during it (boardgame.io's activePlayers already blocks this at the framework
  // level for real clients — see game/game.ts and openSpellReactionWindow below — this is defense
  // in depth for direct move calls, e.g. tests).
  if (G.pendingSpellReaction && G.pendingSpellReaction.casterId === player.id) return INVALID_MOVE;
  const reactingTo = G.pendingSpellReaction && G.pendingSpellReaction.casterId !== player.id ? G.pendingSpellReaction : null;

  const cardId = args.fromChampionZone ? player.championZone : player.hand[args.handIndex ?? -1];
  if (!cardId) return INVALID_MOVE;

  const card = getCard(cardId);
  if (card.type === "rune" || card.type === "legend" || card.type === "battlefield") return INVALID_MOVE;
  if (card.type === "spell" && player.cantPlaySpellsThisTurn) return INVALID_MOVE;

  // Playing INTO an open window: only a [Reaction] spell is legal here — units/gear/champions
  // aren't instant-speed, and nesting a second window (a reaction to a reaction) isn't modeled
  // (see PendingSpellReaction's doc comment).
  if (reactingTo && (card.type !== "spell" || !KeywordEngine.hasKeyword(card, "reaction"))) return INVALID_MOVE;

  const instance = createInstance(G, cardId, player.id);

  if (
    reactingTo &&
    SpecialCaseEngine.hasCounterIntent(card) &&
    (!SpecialCaseEngine.canCounterPending(G, card, instance, reactingTo, args.targetInstanceId) ||
      SpecialCaseEngine.preventsCounter(G, getCard, reactingTo))
  ) {
    return INVALID_MOVE;
  }

  if (SpecialCaseEngine.blocksSelfPlay(G, card, instance)) return INVALID_MOVE;

  if (card.templatedEffect?.trigger === "onPlay") {
    if (
      rejectsInvalidTemplatedTarget(
        G,
        card.templatedEffect.actions,
        instance,
        args.targetInstanceId,
        card.type === "spell",
      )
    ) {
      return INVALID_MOVE;
    }
  }

  if (args.ambushBattlefieldIndex !== undefined) {
    if (card.type !== "unit" && card.type !== "champion") return INVALID_MOVE;
    const slot = G.battlefields[args.ambushBattlefieldIndex];
    if (!slot) return INVALID_MOVE;
    if (SpecialCaseEngine.blocksUnitsPlayedHere(G, getCard, args.ambushBattlefieldIndex, player.id))
      return INVALID_MOVE;
    // Units and champions alike need an actual granted permission to skip Base — Ambush (own
    // units already there), an enemy-occupied grant (Deadbloom Predator), or an open-battlefield
    // grant (Sai Scout and friends) — see cards/special-cases/types.ts. The normal path onto a
    // Battlefield for both is Base, then `attackBattlefield`.
    if (!eligibleAmbushBattlefields(G, card, instance).includes(args.ambushBattlefieldIndex)) {
      return INVALID_MOVE;
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
  const enemyCostIncrease = SpecialCaseEngine.costIncreaseFromEnemies(G, getCard, instance, card);
  const battlefieldCostIncrease = SpecialCaseEngine.costIncreaseFromControlledBattlefields(G, getCard, instance, card);
  const targetCostReduction =
    card.type === "spell"
      ? SpecialCaseEngine.costReductionIfTargeted(G, getCard, args.targetInstanceId, card, instance)
      : 0;
  const nextSpellReduction = card.type === "spell" ? player.nextSpellCostReduction : 0;
  const nextCardReduction = player.nextCardCostReduction;
  const energyNeeded = Math.max(
    0,
    (card.energyCost ?? 0) +
      additionalEnergy +
      enemyCostIncrease +
      battlefieldCostIncrease -
      discardReduction -
      xpReduction -
      selfCostReduction -
      allyCostReduction -
      targetCostReduction -
      nextSpellReduction -
      nextCardReduction,
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

  if (args.fromChampionZone) {
    player.championZone = null;
  } else {
    player.hand.splice(args.handIndex ?? -1, 1);
  }

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

  if (reactingTo) {
    // Resolve the reacting card's own effect first (e.g. Riposte's onPlay reads
    // G.pendingSpellReaction — still set here — to buff its chosen unit by the countered spell's
    // Energy cost), THEN settle the spell it was reacting to.
    resolvePlayedCard(G, player, card, instance, args.targetInstanceId, Boolean(args.payAdditionalCost));
    const counterDestination = SpecialCaseEngine.hasCounterIntent(card) ? SpecialCaseEngine.counterDestination(card) : undefined;
    settlePendingSpellReaction(G, reactingTo, counterDestination);
    events.setActivePlayers({ currentPlayer: Stage.NULL });
    return undefined;
  }

  if (card.type === "spell" && hasReactionCardInHand(G, otherPlayerId(player.id))) {
    G.pendingSpellReaction = {
      casterId: player.id,
      cardId,
      instanceId: instance.instanceId,
      targetInstanceId: args.targetInstanceId,
      payAdditionalCost: Boolean(args.payAdditionalCost),
    };
    events.setActivePlayers({ others: Stage.NULL });
    return undefined;
  }

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

/** Declines to react to the currently-open PendingSpellReaction window — the paused spell resolves normally (uncountered) and the window closes. See moves.ts's playCard for the "react instead" path. */
export const passReaction: MoveFn<GameState> = ({ G, events, playerID }) => {
  const pending = G.pendingSpellReaction;
  if (!pending || pending.casterId === playerID) return INVALID_MOVE;
  settlePendingSpellReaction(G, pending, undefined);
  events.setActivePlayers({ currentPlayer: Stage.NULL });
  return undefined;
};

export interface HideCardArgs {
  handIndex: number;
  /** Which Rune from the pool to recycle as the cost — any domain, doesn't need to be un-exhausted (matching the normal recycle-for-Power rule: only exhausting-for-Energy cares about prior exhaustion). No Power is gained from it; the rune itself IS the payment. */
  runeId: string;
}

/** Plays a [Hidden] card face-down into `player.hiddenZone` — a private reserve (see state.ts's doc comment) — instead of resolving it immediately. Costs recycling 1 Rune (any domain); the card itself is played later, for free, via `playFromHidden`. */
export const hideCard: MoveFn<GameState> = ({ G, playerID }, args: HideCardArgs) => {
  const player = G.players[playerID as "0" | "1"];
  const cardId = player.hand[args.handIndex];
  if (!cardId) return INVALID_MOVE;
  if (!KeywordEngine.hasKeyword(getCard(cardId), "hidden")) return INVALID_MOVE;

  const runeIndex = player.runePool.findIndex((r) => r.instanceId === args.runeId);
  if (runeIndex === -1) return INVALID_MOVE;

  const [rune] = player.runePool.splice(runeIndex, 1);
  player.runeDeck.push(rune);
  player.hand.splice(args.handIndex, 1);
  player.hiddenZone.push(cardId);
  SpecialCaseEngine.onAllyHideCard(G, getCard, player.id, getCard(cardId));
  return undefined;
};

export interface PlayFromHiddenArgs {
  hiddenIndex: number;
  targetInstanceId?: string;
  /** Same as PlayCardArgs.ambushBattlefieldIndex — a unit/champion may still only skip Base with an actual grant (see eligibleAmbushBattlefields). */
  ambushBattlefieldIndex?: number;
}

/** Plays a card out of `player.hiddenZone` for free (0 Energy/Power) — same resolution as a normal hand play (resolvePlayedCard), just sourced from the hidden reserve instead of hand. */
export const playFromHidden: MoveFn<GameState> = ({ G, playerID }, args: PlayFromHiddenArgs) => {
  const player = G.players[playerID as "0" | "1"];
  const cardId = player.hiddenZone[args.hiddenIndex];
  if (!cardId) return INVALID_MOVE;

  const card = getCard(cardId);
  if (card.type === "rune" || card.type === "legend" || card.type === "battlefield") return INVALID_MOVE;

  const instance = createInstance(G, cardId, player.id);
  if (SpecialCaseEngine.blocksSelfPlay(G, card, instance)) return INVALID_MOVE;

  if (card.templatedEffect?.trigger === "onPlay") {
    if (
      rejectsInvalidTemplatedTarget(
        G,
        card.templatedEffect.actions,
        instance,
        args.targetInstanceId,
        card.type === "spell",
      )
    ) {
      return INVALID_MOVE;
    }
  }

  if (args.ambushBattlefieldIndex !== undefined) {
    if (card.type !== "unit" && card.type !== "champion") return INVALID_MOVE;
    const slot = G.battlefields[args.ambushBattlefieldIndex];
    if (!slot) return INVALID_MOVE;
    if (SpecialCaseEngine.blocksUnitsPlayedHere(G, getCard, args.ambushBattlefieldIndex, player.id)) return INVALID_MOVE;
    if (!eligibleAmbushBattlefields(G, card, instance).includes(args.ambushBattlefieldIndex)) return INVALID_MOVE;
  }

  player.hiddenZone.splice(args.hiddenIndex, 1);
  resolvePlayedCard(G, player, card, instance, args.targetInstanceId, false, args.ambushBattlefieldIndex);
  SpecialCaseEngine.onAllyPlayFromHidden(G, getCard, player.id, card);
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
  const defendingController = slot.controller;

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
    if (defendingController && defendingController !== player.id) {
      SpecialCaseEngine.onEnemyAttackHere(G, getCard, defendingController, instance);
    }
  }

  SpecialCaseEngine.onShowdownBegin(G, getCard, args.battlefieldIndex);
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
  const cost = card.activatedAbility?.cost ?? SpecialCaseEngine.activatedAbilityCost(G, card, instance);
  if (!cost) return INVALID_MOVE;
  if (
    card.activatedAbility &&
    rejectsInvalidTemplatedTarget(G, card.activatedAbility.actions, instance, args.targetInstanceId, true)
  ) {
    return INVALID_MOVE;
  }
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

  if (args.targetInstanceId) SpecialCaseEngine.onChosen(G, getCard, player.id, args.targetInstanceId, card);
  if (card.activatedAbility) {
    runTemplatedActions(G, getCard, instance, card.activatedAbility.actions, args.targetInstanceId);
  } else {
    SpecialCaseEngine.onActivate(G, card, instance, args.targetInstanceId);
  }
  if (card.type === "gear") {
    SpecialCaseEngine.onAllyActivatedGearAbility(G, getCard, player.id, instance.instanceId);
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
  const discardSpellIndex = cost.discardSpell ? player.hand.findIndex((id) => getCard(id).type === "spell") : -1;
  if (cost.discardSpell && discardSpellIndex === -1) return INVALID_MOVE;
  let killTarget: CardInstance | undefined;
  if (cost.killFriendlyUnit) {
    for (const other of Object.values(G.instances)) {
      if (other.controller !== player.id || other.instanceId === instance.instanceId) continue;
      const t = getCard(other.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!killTarget || computeMight(G, getCard, other, "none") < computeMight(G, getCard, killTarget, "none")) {
        killTarget = other;
      }
    }
    if (!killTarget) return INVALID_MOVE;
  }

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
  if (cost.discardSpell) {
    const [discarded] = player.hand.splice(discardSpellIndex, 1);
    if (discarded) discardCardToTrash(G, getCard, player.id, discarded);
  }
  if (killTarget) destroyInstance(G, getCard, killTarget.instanceId);

  instance.statuses.empowered = true;
  instance.statuses.everEmpowered = true;
  SpecialCaseEngine.onBecomeEmpowered(G, card, instance);
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
  const cost = card.activatedAbility?.cost ?? SpecialCaseEngine.activatedAbilityCost(G, card, instance);
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

export interface SubmitDeckArgs {
  deck: DeckList;
}

/**
 * Per-player deck submission for an online match (see game/game.ts's "deckSelect" phase, which
 * runs before "battlefieldSelect" and must clear before either player can pick a Battlefield).
 * A local hotseat match already has both decks from game/pendingSetup.ts at setup() time (both
 * players' battlefieldPool is non-empty from tick 0), so this phase's endIf is immediately true
 * there and neither player ever sees or needs this move — it only matters for a real online
 * match, created via the server's Lobby API with no setupData, where each player's own browser
 * submits their own locally-saved deck (see ui/Board.tsx's "deckSelect" screen).
 */
export const submitDeck: MoveFn<GameState> = ({ G, playerID }, args: SubmitDeckArgs) => {
  const id = playerID as "0" | "1";
  if (G.players[id].battlefieldPool.length > 0) return INVALID_MOVE; // already submitted
  if (validateDeck(args.deck).length > 0) return INVALID_MOVE;
  G.players[id] = buildPlayerFromDeckList(id, args.deck);
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
  if (playerState.legend) {
    const legendCard = getCard(playerState.legend.cardId);
    SpecialCaseEngine.onEndOfTurn(
      G,
      legendCard,
      legendPseudoInstance(playerState.legend.cardId, player, playerState.legend.exhausted),
    );
  }
  const toReady = playerState.runePool.filter((r) => r.exhausted).slice(0, playerState.readyRunesAtEndOfTurn);
  for (const rune of toReady) rune.exhausted = false;
  playerState.readyRunesAtEndOfTurn = 0;
  for (const instanceId of G.pendingDisempowerAtEndOfTurn) {
    const instance = G.instances[instanceId];
    if (instance) instance.statuses.empowered = false;
  }
  G.pendingDisempowerAtEndOfTurn = [];
  events.endTurn();
};
