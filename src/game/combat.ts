import type { Card } from "../cards/types";
import { KeywordEngine } from "../keywords/registry";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { computeMight } from "./might";
import { fireTemplatedEffect } from "./templatedEffectEngine";
import type { GameState, PlayerId } from "./state";

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

function livingDamageDealers(
  game: GameState,
  getCard: (id: string) => Card,
  instanceIds: string[],
  role: "attacking" | "defending",
): { instanceId: string; might: number }[] {
  return instanceIds
    .map((instanceId) => game.instances[instanceId])
    .filter((instance) => instance && !KeywordEngine.preventsCombatDamage(game, getCard(instance.cardId), instance))
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
  for (const instanceId of targets) {
    if (remaining <= 0) break;
    const instance = game.instances[instanceId];
    if (!instance) continue;
    const hp = toughness(game, getCard, instanceId, role);
    const hit = Math.min(remaining, hp);
    instance.damage += hit;
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
): void {
  let remaining = totalDamage;
  const destroyed: string[] = [];
  for (const targetInstanceId of targetInstanceIds) {
    if (remaining <= 0) break;
    const target = game.instances[targetInstanceId];
    if (!target) continue;
    const hp = computeMight(game, getCard, target, "none");
    const hit = Math.min(remaining, hp);
    target.damage += hit;
    remaining -= hit;
    if (target.damage >= hp) destroyed.push(targetInstanceId);
  }
  for (const id of destroyed) destroyInstance(game, getCard, id);
}

export function destroyInstance(game: GameState, getCard: (id: string) => Card, instanceId: string): void {
  const instance = game.instances[instanceId];
  if (!instance) return;
  const card = getCard(instance.cardId);

  KeywordEngine.fireOnDestroy(game, card, instance);
  SpecialCaseEngine.onDestroy(game, card, instance);
  fireTemplatedEffect(game, getCard, card, instance, "onDestroy");

  if (instance.battlefieldIndex !== null) {
    const slot = game.battlefields[instance.battlefieldIndex];
    slot.units[instance.controller] = slot.units[instance.controller].filter((id) => id !== instanceId);
  }
  const player = game.players[instance.controller];
  player.base = player.base.filter((id) => id !== instanceId);
  player.trash.push(instance.cardId);
  delete game.instances[instanceId];
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
    fireTemplatedEffect(game, getCard, getCard(instance.cardId), instance, "onDefend");
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

  const attackerSurvivors = slot.units[attacker].length;
  const defenderSurvivors = slot.units[defender].length;
  if (defenderSurvivors === 0 && attackerSurvivors > 0) {
    conquerBattlefield(game, getCard, battlefieldIndex, attacker, attackerExcessDamage);
  }
}

/** Fires Hunt-style Hold triggers for every unit a player has on Battlefields they control, at their Beginning step. */
export function resolveHoldTriggers(game: GameState, getCard: (id: string) => Card, player: PlayerId): void {
  game.battlefields.forEach((slot) => {
    if (slot.controller !== player) return;
    for (const instanceId of [...slot.units[player]]) {
      const instance = game.instances[instanceId];
      if (!instance) continue;
      const card = getCard(instance.cardId);
      const xp = KeywordEngine.xpOnConquerOrHold(game, card, instance);
      if (xp > 0) game.players[player].xp += xp;
      fireTemplatedEffect(game, getCard, card, instance, "onHold");
      SpecialCaseEngine.onHold(game, card, instance);
    }
  });
}
