import type { Card } from "../cards/types";
import { KeywordEngine } from "../keywords/registry";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { computeMight } from "./might";
import { fireTemplatedEffect } from "./templatedEffectEngine";
import { battlefieldPseudoInstance, legendPseudoInstance } from "./pseudoInstance";
import type { CardInstance, GameState, PlayerId } from "./state";

/**
 * Combat resolution assumption (unverified against the full official rules
 * text, which we could not fetch): both sides' total Might is computed once
 * at the start of the Showdown and damage is assigned simultaneously, mirroring
 * Legends of Runeterra-style combat (Riftbound is built by the same team).
 * The alternative — a strictly sequential attacker-then-defender strike where
 * a wiped-out side never swings back — would need a rules citation to adopt.
 */

function otherPlayer(id: PlayerId): PlayerId {
  return id === "0" ? "1" : "0";
}

function hasActiveKeyword(card: Card, instance: CardInstance, name: string): boolean {
  return KeywordEngine.hasKeyword(card, name) || instance.grantedThisTurn.some((k) => k.keyword === name);
}

/**
 * [Tank] units are assigned combat damage first, [Backline] units last, everyone else in
 * between — stable within each group (see e.g. Xin Zhao, Vigilant / Galio, Indefatigable for
 * Tank, LeBlanc, Everywhere at Once / Enthusiastic Promoter for Backline).
 */
function orderForDamageAssignment(
  game: GameState,
  getCard: (id: string) => Card,
  targets: string[],
): string[] {
  return targets
    .map((instanceId, index) => {
      const instance = game.instances[instanceId];
      let rank = 1;
      if (instance) {
        const card = getCard(instance.cardId);
        if (hasActiveKeyword(card, instance, "tank")) rank = 0;
        else if (hasActiveKeyword(card, instance, "backline") || SpecialCaseEngine.hasConditionalBackline(game, card, instance)) rank = 2;
      }
      return { instanceId, rank, index };
    })
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.instanceId);
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

/** Assigns damage to each target up to its toughness, in order. Returns the leftover damage that couldn't be assigned to anyone (the "excess damage" referenced by conquer-time triggers like Tryndamere). */
function assignDamage(
  game: GameState,
  getCard: (id: string) => Card,
  totalDamage: number,
  targets: string[],
  role: "attacking" | "defending",
): number {
  let remaining = totalDamage;
  for (const instanceId of orderForDamageAssignment(game, getCard, targets)) {
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

function conquerBattlefield(
  game: GameState,
  getCard: (id: string) => Card,
  battlefieldIndex: number,
  newController: PlayerId,
  excessDamage: number,
): void {
  const slot = game.battlefields[battlefieldIndex];
  slot.controller = newController;
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

/** Resolves a Showdown at the given battlefield between its two committed unit groups. */
export function resolveCombat(
  game: GameState,
  getCard: (id: string) => Card,
  battlefieldIndex: number,
  attacker: PlayerId,
): void {
  const slot = game.battlefields[battlefieldIndex];
  const defender = otherPlayer(attacker);
  const attackerIds = slot.units[attacker];
  const defenderIds = slot.units[defender];

  if (defenderIds.length === 0) {
    if (attackerIds.length > 0) conquerBattlefield(game, getCard, battlefieldIndex, attacker, 0);
    return;
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

  const attackerDealers = livingDamageDealers(game, getCard, attackerIds, "attacking");
  const defenderDealers = livingDamageDealers(game, getCard, defenderIds, "defending");
  const attackerTotalDamage = attackerDealers.reduce((sum, d) => sum + d.might, 0);
  const defenderTotalDamage = defenderDealers.reduce((sum, d) => sum + d.might, 0);

  const attackerExcessDamage = assignDamage(game, getCard, attackerTotalDamage, defenderIds, "defending");
  assignDamage(game, getCard, defenderTotalDamage, attackerIds, "attacking");

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
  if (defenderSurvivors === 0 && attackerSurvivors > 0) {
    conquerBattlefield(game, getCard, battlefieldIndex, attacker, attackerExcessDamage);
    SpecialCaseEngine.onWinCombat(game, getCard, attacker);
  } else if (attackerSurvivors === 0 && defenderSurvivors > 0) {
    SpecialCaseEngine.onWinCombat(game, getCard, defender);
  }
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
