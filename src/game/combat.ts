import type { ActivePlayersArg } from "boardgame.io";
import { Stage } from "boardgame.io/core";
import type { Card } from "../cards/types";
import { KeywordEngine } from "../keywords/registry";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { computeMight } from "./might";
import { fireTemplatedEffect } from "./templatedEffectEngine";
import { battlefieldPseudoInstance, legendPseudoInstance } from "./pseudoInstance";
import type { CardInstance, CombatHit, GameState, PlayerId } from "./state";

/**
 * Confirmed against the official Riftbound Core Rules (rule 460.2.a/b/c): both sides' total Might
 * is summed once at the start of the Showdown, then, starting with the Attacker, each player
 * assigns their damage to the units they're fighting — simultaneously in the sense that a wiped-out
 * side still deals its full damage back, not a strictly sequential strike where death cuts short a
 * side's own swing.
 */

function otherPlayer(id: PlayerId): PlayerId {
  return id === "0" ? "1" : "0";
}

function hasActiveKeyword(card: Card, instance: CardInstance, name: string): boolean {
  return KeywordEngine.hasKeyword(card, name) || instance.grantedThisTurn.some((k) => k.keyword === name);
}

/** [Tank] units rank first (0), [Backline] units rank last (2), everyone else in between (1). */
function rankForDamageAssignment(
  game: GameState,
  getCard: (id: string) => Card,
  instanceId: string,
  battlefieldIndex: number,
  assigningPlayer: PlayerId,
): number {
  const instance = game.instances[instanceId];
  if (!instance) return 1;
  const card = getCard(instance.cardId);
  const ignoreTank = SpecialCaseEngine.ignoresTankHere(game, getCard, battlefieldIndex, assigningPlayer);
  if (hasActiveKeyword(card, instance, "tank") && !ignoreTank) return 0;
  if (hasActiveKeyword(card, instance, "backline") || SpecialCaseEngine.hasConditionalBackline(game, card, instance)) return 2;
  return 1;
}

/**
 * [Tank] units are assigned combat damage first, [Backline] units last, everyone else in
 * between — stable within each group (see e.g. Xin Zhao, Vigilant / Galio, Indefatigable for
 * Tank, LeBlanc, Everywhere at Once / Enthusiastic Promoter for Backline). This is the DEFAULT
 * order used when a side has no real choice to make (see hasRealDamageChoice below) — when they
 * do, the player's submitted order (validated by isValidDamageOrder) is used instead.
 */
function orderForDamageAssignment(
  game: GameState,
  getCard: (id: string) => Card,
  targets: string[],
  battlefieldIndex: number,
  assigningPlayer: PlayerId,
): string[] {
  return targets
    .map((instanceId, index) => ({ instanceId, rank: rankForDamageAssignment(game, getCard, instanceId, battlefieldIndex, assigningPlayer), index }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.instanceId);
}

/**
 * True when `targets` has 2+ units sharing the same Tank/normal/Backline rank — i.e. rule
 * 460.2.c's "in any order they choose" is actually ambiguous. When every rank has at most one
 * unit, there's exactly one legal order and no real choice exists, so no player-facing window
 * is needed.
 */
export function hasRealDamageChoice(
  game: GameState,
  getCard: (id: string) => Card,
  targets: string[],
  battlefieldIndex: number,
  assigningPlayer: PlayerId,
): boolean {
  const counts = new Map<number, number>();
  for (const instanceId of targets) {
    const rank = rankForDamageAssignment(game, getCard, instanceId, battlefieldIndex, assigningPlayer);
    counts.set(rank, (counts.get(rank) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count >= 2);
}

/**
 * Validates a player-submitted damage order: must be a permutation of `targets`, and must respect
 * Tank-first/Backline-last rank-monotonicity (rule 460.2.c, 815, 826) — free choice within a rank,
 * no reordering across ranks.
 */
export function isValidDamageOrder(
  game: GameState,
  getCard: (id: string) => Card,
  targets: string[],
  order: string[],
  battlefieldIndex: number,
  assigningPlayer: PlayerId,
): boolean {
  if (order.length !== targets.length) return false;
  if (new Set(order).size !== order.length) return false;
  const targetSet = new Set(targets);
  if (!order.every((id) => targetSet.has(id))) return false;
  let lastRank = -1;
  for (const instanceId of order) {
    const rank = rankForDamageAssignment(game, getCard, instanceId, battlefieldIndex, assigningPlayer);
    if (rank < lastRank) return false;
    lastRank = rank;
  }
  return true;
}

function livingDamageDealers(
  game: GameState,
  getCard: (id: string) => Card,
  instanceIds: string[],
  role: "attacking" | "defending",
): { instanceId: string; might: number }[] {
  return instanceIds
    .map((instanceId) => game.instances[instanceId])
    .filter(
      (instance) =>
        instance &&
        !KeywordEngine.preventsCombatDamage(game, getCard(instance.cardId), instance) &&
        !SpecialCaseEngine.preventsCombatDamage(game, getCard(instance.cardId), instance) &&
        !SpecialCaseEngine.preventsCombatDamageForEnemy(game, getCard, instance),
    )
    .map((instance) => ({
      instanceId: instance.instanceId,
      might: computeMight(game, getCard, instance, role),
    }));
}

function toughness(
  game: GameState,
  getCard: (id: string) => Card,
  instanceId: string,
  role: "attacking" | "defending",
): number {
  const instance = game.instances[instanceId];
  return computeMight(game, getCard, instance, role);
}

/** Assigns damage to each target up to its toughness, in the given order (already resolved — either the only legal order, or a validated player choice). Returns the leftover damage that couldn't be assigned to anyone (the "excess damage" referenced by conquer-time triggers like Tryndamere). */
function assignDamage(
  game: GameState,
  getCard: (id: string) => Card,
  totalDamage: number,
  order: string[],
  role: "attacking" | "defending",
  assigningPlayer: PlayerId,
): number {
  let remaining = totalDamage;
  for (const instanceId of order) {
    if (remaining <= 0) break;
    const instance = game.instances[instanceId];
    if (!instance) continue;
    if (instance.statuses.preventNextDamageThisTurn) {
      instance.statuses.preventNextDamageThisTurn = false;
      continue;
    }
    const hp = toughness(game, getCard, instanceId, role);
    const hit = Math.min(remaining, hp);
    let appliedDamage = hit;
    if (instance.damagePreventionPool > 0) {
      const absorbed = Math.min(instance.damagePreventionPool, appliedDamage);
      instance.damagePreventionPool -= absorbed;
      appliedDamage -= absorbed;
    }
    appliedDamage *= instance.damageMultiplier;
    instance.damage += appliedDamage;
    if (appliedDamage > 0) instance.statuses.tookDamageThisTurn = true;
    if (appliedDamage > 0 && game.anyDamageKillsThisTurn) {
      destroyInstance(game, getCard, instanceId);
      SpecialCaseEngine.onAllyKillUnit(game, getCard, assigningPlayer, instance);
    }
    remaining -= hit;
  }
  return Math.max(0, remaining);
}

/**
 * Deals `totalDamage` sequentially across `targetInstanceIds` (each filled to its own toughness
 * before moving to the next), destroying any that die. For non-combat, non-spell effects like
 * "deal 5 damage split among any number of enemy units here" — no player choice of how to split
 * (documented simplification, same spirit as the discard-choice one elsewhere in this file).
 */
export function dealDistributedDamage(
  game: GameState,
  getCard: (id: string) => Card,
  targetInstanceIds: string[],
  totalDamage: number,
): string[] {
  let remaining = totalDamage;
  const destroyed: string[] = [];
  for (const targetInstanceId of targetInstanceIds) {
    if (remaining <= 0) break;
    const target = game.instances[targetInstanceId];
    if (!target) continue;
    const hp = computeMight(game, getCard, target, "none");
    const hit = Math.min(remaining, hp);
    target.damage += hit;
    if (hit > 0) target.statuses.tookDamageThisTurn = true;
    remaining -= hit;
    if (target.damage >= hp) destroyed.push(targetInstanceId);
  }
  for (const id of destroyed) destroyInstance(game, getCard, id);
  return destroyed;
}

export function destroyInstance(game: GameState, getCard: (id: string) => Card, instanceId: string): void {
  const instance = game.instances[instanceId];
  if (!instance) return;
  const card = getCard(instance.cardId);

  if (instance.statuses.preventNextDeathThisTurn || SpecialCaseEngine.preventsAllyDeath(game, getCard, instance)) {
    instance.statuses.preventNextDeathThisTurn = false;
    if (instance.battlefieldIndex !== null) {
      const slot = game.battlefields[instance.battlefieldIndex];
      slot.units[instance.controller] = slot.units[instance.controller].filter((id) => id !== instanceId);
    }
    instance.zone = "base";
    instance.battlefieldIndex = null;
    instance.damage = 0;
    instance.exhausted = true;
    game.players[instance.controller].base.push(instanceId);
    return;
  }

  KeywordEngine.fireOnDestroy(game, card, instance);
  SpecialCaseEngine.onDestroy(game, card, instance);
  fireTemplatedEffect(game, getCard, card, instance, "onDestroy");

  if (instance.battlefieldIndex !== null) {
    const slot = game.battlefields[instance.battlefieldIndex];
    slot.units[instance.controller] = slot.units[instance.controller].filter((id) => id !== instanceId);
  }
  const player = game.players[instance.controller];
  player.base = player.base.filter((id) => id !== instanceId);
  if (SpecialCaseEngine.recycleSelfOnDestroy(game, card, instance)) {
    player.mainDeck.push(instance.cardId);
  } else {
    player.trash.push(instance.cardId);
  }
  delete game.instances[instanceId];

  if (card.type === "unit" || card.type === "champion") {
    game.anyUnitDiedThisTurn = true;
    SpecialCaseEngine.onAllyUnitDied(game, getCard, instance.controller, instance);
    SpecialCaseEngine.onEnemyUnitDied(game, getCard, instance.controller, instance);
    game.players[otherPlayer(instance.controller)].enemyUnitDiedThisTurn = true;
    if (game.turnPhase === "beginning") {
      game.players[instance.controller].friendlyUnitDiedDuringBeginningThisTurn = true;
    }
  }
}

/**
 * Rule 323.7/461.5.c: a Hidden card only stays hidden "for as long as you control" the Battlefield
 * it's bound to (see state.ts's HiddenCard) — the instant control changes to someone else, it's
 * discarded to its owner's trash, face down or not. conquerBattlefield is the only place
 * `slot.controller` is ever reassigned, so it's the single chokepoint for this.
 */
function discardHiddenCardsLosingControl(game: GameState, battlefieldIndex: number, newController: PlayerId): void {
  for (const playerId of Object.keys(game.players) as PlayerId[]) {
    if (playerId === newController) continue;
    const state = game.players[playerId];
    const kept: typeof state.hiddenZone = [];
    for (const hidden of state.hiddenZone) {
      if (hidden.battlefieldIndex === battlefieldIndex) {
        state.trash.push(hidden.cardId);
      } else {
        kept.push(hidden);
      }
    }
    state.hiddenZone = kept;
  }
}

function conquerBattlefield(
  game: GameState,
  getCard: (id: string) => Card,
  battlefieldIndex: number,
  newController: PlayerId,
  excessDamage: number,
): void {
  const slot = game.battlefields[battlefieldIndex];
  slot.controller = newController;
  discardHiddenCardsLosingControl(game, battlefieldIndex, newController);
  game.players[newController].points += 1;
  for (const instanceId of slot.units[newController]) {
    const instance = game.instances[instanceId];
    if (!instance) continue;
    const card = getCard(instance.cardId);
    const xp = KeywordEngine.xpOnConquerOrHold(game, card, instance);
    if (xp > 0) game.players[newController].xp += xp;
    fireTemplatedEffect(game, getCard, card, instance, "onConquer");
    SpecialCaseEngine.onConquer(game, card, instance, excessDamage);
  }

  const conqueringLegend = game.players[newController].legend;
  if (conqueringLegend) {
    const legendCard = getCard(conqueringLegend.cardId);
    if (legendCard.specialCaseId) {
      // Abuses the pseudo-instance's battlefieldIndex field (normally battlefield-only) to let
      // Legend onConquer handlers see which Battlefield was just conquered (e.g. Might of
      // Demacia: "if you have 4+ units at that battlefield"), since the Legend has no real zone.
      const pseudo = legendPseudoInstance(conqueringLegend.cardId, newController, conqueringLegend.exhausted);
      pseudo.battlefieldIndex = battlefieldIndex;
      SpecialCaseEngine.onConquer(game, legendCard, pseudo, excessDamage);
    }
  }

  const battlefieldCard = getCard(slot.cardId);
  if (battlefieldCard.specialCaseId) {
    SpecialCaseEngine.onConquerHere(
      game,
      battlefieldCard,
      battlefieldPseudoInstance(slot.cardId, newController, battlefieldIndex),
      slot.units[newController],
      excessDamage,
    );
  }
}

interface CombatPrep {
  defaultAttackerOrder: string[];
  defaultDefenderOrder: string[];
  attackerHasChoice: boolean;
  defenderHasChoice: boolean;
}

/**
 * Shared setup for both resolveCombat (legacy/test-only immediate path) and
 * beginCombatDamageAssignment (the real move-driven path): resolves the undefended walk-in case
 * outright, runs onDefend hooks, and computes each side's default damage order plus whether that
 * side actually has a choice to make. Returns null when the walk-in case already handled
 * everything (nothing left to resolve).
 */
function prepareCombat(game: GameState, getCard: (id: string) => Card, battlefieldIndex: number, attacker: PlayerId): CombatPrep | null {
  const slot = game.battlefields[battlefieldIndex];
  const defender = otherPlayer(attacker);
  const attackerIds = slot.units[attacker];
  const defenderIds = slot.units[defender];

  if (defenderIds.length === 0) {
    if (attackerIds.length > 0) conquerBattlefield(game, getCard, battlefieldIndex, attacker, 0);
    // No defenders means no actual Showdown — clear any stale summary from an earlier fight so the
    // UI doesn't re-show it (see GameState.lastCombatResult).
    game.lastCombatResult = null;
    return null;
  }

  for (const instanceId of defenderIds) {
    const instance = game.instances[instanceId];
    if (!instance) continue;
    const defenderCard = getCard(instance.cardId);
    fireTemplatedEffect(game, getCard, defenderCard, instance, "onDefend");
    if (defenderCard.specialCaseId) SpecialCaseEngine.onDefend(game, defenderCard, instance);
  }

  const battlefieldCard = getCard(slot.cardId);
  if (battlefieldCard.specialCaseId) {
    SpecialCaseEngine.onDefendHere(
      game,
      battlefieldCard,
      battlefieldPseudoInstance(slot.cardId, defender, battlefieldIndex),
      defenderIds,
    );
  }

  return {
    defaultAttackerOrder: orderForDamageAssignment(game, getCard, defenderIds, battlefieldIndex, attacker),
    defaultDefenderOrder: orderForDamageAssignment(game, getCard, attackerIds, battlefieldIndex, defender),
    attackerHasChoice: hasRealDamageChoice(game, getCard, defenderIds, battlefieldIndex, attacker),
    defenderHasChoice: hasRealDamageChoice(game, getCard, attackerIds, battlefieldIndex, defender),
  };
}

/**
 * Legacy/test-only entry point: resolves a Showdown immediately using each side's default
 * (Tank-first/Backline-last) damage order, without ever pausing for a player choice — used
 * throughout the test suite to drive combat directly. The real move-driven path
 * (moves.ts's attackBattlefield/passCombatReaction/playCard) calls beginCombatDamageAssignment
 * instead, which pauses when a side has a genuine choice to make (see hasRealDamageChoice).
 */
export function resolveCombat(game: GameState, getCard: (id: string) => Card, battlefieldIndex: number, attacker: PlayerId): void {
  const prep = prepareCombat(game, getCard, battlefieldIndex, attacker);
  if (!prep) return;
  finishCombatResolution(game, getCard, battlefieldIndex, attacker, prep.defaultAttackerOrder, prep.defaultDefenderOrder);
}

/**
 * Begins resolving a Showdown at the given battlefield: runs onDefend hooks and computes damage
 * totals, then either finishes immediately (when neither side has a real damage-order choice — see
 * hasRealDamageChoice) or pauses on `game.pendingDamageAssignment` for one or both players to
 * submit an order via moves.ts's submitDamageAssignment (rule 460.2.c).
 */
export function beginCombatDamageAssignment(
  game: GameState,
  getCard: (id: string) => Card,
  events: { setActivePlayers: (arg: ActivePlayersArg) => void },
  battlefieldIndex: number,
  attacker: PlayerId,
): void {
  const prep = prepareCombat(game, getCard, battlefieldIndex, attacker);
  if (!prep) return;

  if (!prep.attackerHasChoice && !prep.defenderHasChoice) {
    finishCombatResolution(game, getCard, battlefieldIndex, attacker, prep.defaultAttackerOrder, prep.defaultDefenderOrder);
    return;
  }

  game.pendingDamageAssignment = {
    battlefieldIndex,
    attacker,
    defender: otherPlayer(attacker),
    attackerOrder: prep.attackerHasChoice ? null : prep.defaultAttackerOrder,
    defenderOrder: prep.defenderHasChoice ? null : prep.defaultDefenderOrder,
  };
  events.setActivePlayers({ all: Stage.NULL });
}

/**
 * Finishes resolving a Showdown once both sides' damage orders are known (either the only legal
 * order, or a player's validated choice — see beginCombatDamageAssignment/isValidDamageOrder).
 * Applies damage, destroys the dead, resets survivors, and settles conquest.
 */
export function finishCombatResolution(
  game: GameState,
  getCard: (id: string) => Card,
  battlefieldIndex: number,
  attacker: PlayerId,
  attackerOrder: string[],
  defenderOrder: string[],
): void {
  const slot = game.battlefields[battlefieldIndex];
  const defender = otherPlayer(attacker);
  const attackerIds = slot.units[attacker];
  const defenderIds = slot.units[defender];

  const attackerDealers = livingDamageDealers(game, getCard, attackerIds, "attacking");
  const defenderDealers = livingDamageDealers(game, getCard, defenderIds, "defending");
  const attackerTotalDamage = attackerDealers.reduce((sum, d) => sum + d.might, 0);
  const defenderTotalDamage = defenderDealers.reduce((sum, d) => sum + d.might, 0);

  const attackerExcessDamage = assignDamage(game, getCard, attackerTotalDamage, attackerOrder, "defending", attacker);
  assignDamage(game, getCard, defenderTotalDamage, defenderOrder, "attacking", defender);

  // Snapshot per-unit damage now, before the end-of-Showdown reset-to-0 loop below overwrites it —
  // this is what powers the UI's post-combat summary (GameState.lastCombatResult).
  const hits: CombatHit[] = [];
  for (const instanceId of [...defenderIds, ...attackerIds]) {
    const instance = game.instances[instanceId];
    if (!instance) continue;
    const hp = toughness(game, getCard, instanceId, defenderIds.includes(instanceId) ? "defending" : "attacking");
    hits.push({
      instanceId,
      cardId: instance.cardId,
      controller: instance.controller,
      damage: instance.damage,
      died: instance.damage >= hp,
    });
  }

  const destroyedDefenders = defenderIds.filter(
    (id) => game.instances[id] && game.instances[id].damage >= toughness(game, getCard, id, "defending"),
  );
  const destroyedAttackers = attackerIds.filter(
    (id) => game.instances[id] && game.instances[id].damage >= toughness(game, getCard, id, "attacking"),
  );
  const killedByAttacker = destroyedDefenders.map((id) => game.instances[id]);
  const killedByDefender = destroyedAttackers.map((id) => game.instances[id]);
  for (const id of destroyedDefenders) destroyInstance(game, getCard, id);
  for (const id of destroyedAttackers) destroyInstance(game, getCard, id);
  for (const killed of killedByAttacker) SpecialCaseEngine.onAllyKillUnit(game, getCard, attacker, killed);
  for (const killed of killedByDefender) SpecialCaseEngine.onAllyKillUnit(game, getCard, defender, killed);

  for (const id of [...slot.units[attacker], ...slot.units[defender]]) {
    const instance = game.instances[id];
    if (instance) instance.damage = 0;
  }

  for (const id of [...slot.units[attacker], ...slot.units[defender]]) {
    const instance = game.instances[id];
    if (!instance) continue;
    const survivorCard = getCard(instance.cardId);
    if (survivorCard.specialCaseId) SpecialCaseEngine.onSurviveCombat(game, survivorCard, instance);
    if (instance.pendingSurviveCombatXP > 0) {
      game.players[instance.controller].xp += instance.pendingSurviveCombatXP;
      instance.pendingSurviveCombatXP = 0;
    }
  }

  const attackerSurvivors = slot.units[attacker].length;
  const defenderSurvivors = slot.units[defender].length;
  let conqueredBy: PlayerId | null = null;
  if (defenderSurvivors === 0 && attackerSurvivors > 0) {
    conqueredBy = attacker;
    conquerBattlefield(game, getCard, battlefieldIndex, attacker, attackerExcessDamage);
    SpecialCaseEngine.onWinCombat(game, getCard, attacker);
  } else if (attackerSurvivors === 0 && defenderSurvivors > 0) {
    SpecialCaseEngine.onWinCombat(game, getCard, defender);
  }

  game.nextInstanceSeq += 1;
  game.lastCombatResult = {
    seq: game.nextInstanceSeq,
    battlefieldIndex,
    attacker,
    defender,
    attackerDamageDealt: attackerTotalDamage,
    defenderDamageDealt: defenderTotalDamage,
    hits,
    conqueredBy,
  };
}

/** Fires Hunt-style Hold triggers for every unit a player has on Battlefields they control, at their Beginning step. */
export function resolveHoldTriggers(game: GameState, getCard: (id: string) => Card, player: PlayerId): void {
  game.battlefields.forEach((slot, index) => {
    if (slot.controller !== player) return;
    const battlefieldCard = getCard(slot.cardId);
    if (battlefieldCard.specialCaseId) {
      SpecialCaseEngine.onHold(game, battlefieldCard, battlefieldPseudoInstance(slot.cardId, player, index));
    }
    for (const instanceId of [...slot.units[player]]) {
      const instance = game.instances[instanceId];
      if (!instance) continue;
      const card = getCard(instance.cardId);
      const xp = KeywordEngine.xpOnConquerOrHold(game, card, instance);
      if (xp > 0) game.players[player].xp += xp;
      fireTemplatedEffect(game, getCard, card, instance, "onHold");
      SpecialCaseEngine.onHold(game, card, instance);
    }
    const legend = game.players[player].legend;
    if (legend) {
      const legendCard = getCard(legend.cardId);
      if (legendCard.specialCaseId) {
        const pseudo = legendPseudoInstance(legend.cardId, player, legend.exhausted);
        pseudo.battlefieldIndex = index;
        SpecialCaseEngine.onHold(game, legendCard, pseudo);
      }
    }
  });
}
