import type { Card, KeywordInstance } from "../cards/types";
import type { CardInstance, GameState } from "../game/state";
import type { KeywordContext, KeywordHandler } from "./types";
import { stunHandler } from "./handlers/stun";
import { empoweredHandler } from "./handlers/empowered";
import { ambushHandler } from "./handlers/ambush";
import { huntHandler } from "./handlers/hunt";
import { accelerateHandler } from "./handlers/accelerate";
import { assaultHandler } from "./handlers/assault";
import { deflectHandler } from "./handlers/deflect";
import { legionHandler } from "./handlers/legion";
import { shieldHandler } from "./handlers/shield";
import { deathknellHandler } from "./handlers/deathknell";
import { visionHandler } from "./handlers/vision";

const handlers: KeywordHandler[] = [
  stunHandler,
  empoweredHandler,
  ambushHandler,
  huntHandler,
  accelerateHandler,
  assaultHandler,
  deflectHandler,
  legionHandler,
  shieldHandler,
  deathknellHandler,
  visionHandler,
];

const registry = new Map<string, KeywordHandler>(handlers.map((h) => [h.name, h]));

export function getKeywordHandler(name: string): KeywordHandler | undefined {
  return registry.get(name.toLowerCase());
}

function contextsFor(
  game: GameState,
  card: Card,
  instance: CardInstance,
): { handler: KeywordHandler; ctx: KeywordContext }[] {
  const result: { handler: KeywordHandler; ctx: KeywordContext }[] = [];
  // Printed keywords + anything granted "this turn" by another card's effect (see
  // CardInstance.grantedThisTurn) are treated identically by every hook below.
  for (const keyword of [...card.keywords, ...instance.grantedThisTurn]) {
    const handler = getKeywordHandler(keyword.keyword);
    if (!handler) continue;
    result.push({ handler, ctx: { game, card, instance, keyword } });
  }
  return result;
}

function sumHook(
  game: GameState,
  card: Card,
  instance: CardInstance,
  hook: (h: KeywordHandler) => ((ctx: KeywordContext) => number) | undefined,
): number {
  let total = 0;
  for (const { handler, ctx } of contextsFor(game, card, instance)) {
    const fn = hook(handler);
    if (fn) total += fn(ctx);
  }
  return total;
}

function anyHook(
  game: GameState,
  card: Card,
  instance: CardInstance,
  hook: (h: KeywordHandler) => ((ctx: KeywordContext) => boolean) | undefined,
): boolean {
  for (const { handler, ctx } of contextsFor(game, card, instance)) {
    const fn = hook(handler);
    if (fn && fn(ctx)) return true;
  }
  return false;
}

export const KeywordEngine = {
  attackingMightModifier: (game: GameState, card: Card, instance: CardInstance) =>
    sumHook(game, card, instance, (h) => h.attackingMightModifier),

  defendingMightModifier: (game: GameState, card: Card, instance: CardInstance) =>
    sumHook(game, card, instance, (h) => h.defendingMightModifier),

  // Stun is normally inflicted at runtime (a spell/ability targets a unit),
  // not printed on the affected card itself, so this checks the status flag
  // directly in addition to running any keyword-driven hooks.
  preventsCombatDamage: (game: GameState, card: Card, instance: CardInstance) =>
    Boolean(instance.statuses.stunned) ||
    anyHook(game, card, instance, (h) => h.preventsCombatDamage),

  allowsPlayToOccupiedBattlefield: (game: GameState, card: Card, instance: CardInstance) =>
    anyHook(game, card, instance, (h) => h.allowsPlayToOccupiedBattlefield),

  grantsReactionTiming: (game: GameState, card: Card, instance: CardInstance) =>
    anyHook(game, card, instance, (h) => h.grantsReactionTiming),

  conditionalTriggerActive: (game: GameState, card: Card, instance: CardInstance) =>
    anyHook(game, card, instance, (h) => h.conditionalTriggerActive),

  additionalPlayCostEnergy: (game: GameState, card: Card, instance: CardInstance) =>
    sumHook(game, card, instance, (h) => h.additionalPlayCostEnergy),

  entersReadyIfCostPaid: (game: GameState, card: Card, instance: CardInstance) =>
    anyHook(game, card, instance, (h) => h.entersReadyIfCostPaid),

  xpOnConquerOrHold: (game: GameState, card: Card, instance: CardInstance) =>
    sumHook(game, card, instance, (h) => h.xpOnConquerOrHold),

  extraTargetingCost: (game: GameState, card: Card, instance: CardInstance) =>
    sumHook(game, card, instance, (h) => h.extraTargetingCost),

  fireOnDestroy: (game: GameState, card: Card, instance: CardInstance) => {
    for (const { handler, ctx } of contextsFor(game, card, instance)) {
      handler.onDestroy?.(ctx);
    }
  },

  fireOnPlay: (game: GameState, card: Card, instance: CardInstance) => {
    for (const { handler, ctx } of contextsFor(game, card, instance)) {
      handler.onPlay?.(ctx);
    }
  },

  hasKeyword: (card: Card, name: string): boolean =>
    card.keywords.some((k) => k.keyword.toLowerCase() === name.toLowerCase()),

  keywordValue: (card: Card, name: string): number | undefined =>
    card.keywords.find((k) => k.keyword.toLowerCase() === name.toLowerCase())?.value,
};

export type { KeywordInstance };
