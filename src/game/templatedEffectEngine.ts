import type { Card } from "../cards/types";
import type { TemplatedAction, TemplatedTargetSpec, TemplatedTrigger } from "../cards/templatedEffects";
import type { CardInstance, GameState, PlayerId } from "./state";
import { destroyInstance } from "./combat";
import { discardCardToTrash } from "./discardEngine";

/**
 * Interpreter for auto-matched TemplatedEffect data (see
 * scripts/match-templated-effects.mjs and docs/rules-reference.md). Executes
 * a small, fixed vocabulary of action primitives against real game state —
 * no bespoke code per card. Cards whose text didn't reduce to this vocabulary
 * stay in special-cases-todo.json.
 *
 * Target-choice simplification: only the `onPlay` trigger has a player-facing
 * target picker today (see Board.tsx `pendingTarget`), because it's the only
 * trigger driven by an explicit move where a UI pause is easy. For every
 * other trigger (onConquer/onHold/onAttack/onDefend/onMove/onDestroy), a
 * "choose" target auto-resolves to the first valid candidate in a stable
 * order. This is a documented MVP gap, not a hidden one — upgrading it to a
 * real per-trigger choice UI is future work.
 */

function otherPlayer(id: PlayerId): PlayerId {
  return id === "0" ? "1" : "0";
}

/**
 * Legal candidates for a "choose" target spec, given `source` (the card being played/activated).
 * Exported so both the UI (filtering the target picker + disabling play with zero candidates —
 * see Board.tsx) and moves.ts (rejecting a play/activation whose target has no legal candidate,
 * instead of silently letting it resolve to a no-op) share the exact same eligibility rules as
 * the engine's own resolveTargets below — a client-side reimplementation could drift out of sync.
 */
export function candidatesForTarget(
  game: GameState,
  getCard: (id: string) => Card,
  source: CardInstance,
  spec: TemplatedTargetSpec,
): CardInstance[] {
  const sameBattlefield = (instance: CardInstance) =>
    !spec.atBattlefieldOnly || instance.battlefieldIndex === source.battlefieldIndex;

  switch (spec.kind) {
    case "self":
      return [source];
    case "chooseUnit":
      return Object.values(game.instances).filter((i) => {
        const c = getCard(i.cardId);
        return (c.type === "unit" || c.type === "champion") && sameBattlefield(i);
      });
    case "chooseFriendlyUnit":
      return Object.values(game.instances).filter((i) => {
        const c = getCard(i.cardId);
        return i.controller === source.controller && (c.type === "unit" || c.type === "champion") && sameBattlefield(i);
      });
    case "chooseEnemyUnit":
      return Object.values(game.instances).filter((i) => {
        const c = getCard(i.cardId);
        return i.controller === otherPlayer(source.controller) && (c.type === "unit" || c.type === "champion") && sameBattlefield(i);
      });
    case "chooseFriendlyGear":
      return Object.values(game.instances).filter((i) => {
        const c = getCard(i.cardId);
        return i.controller === source.controller && c.type === "gear";
      });
    case "allEnemyUnitsAtBattlefield":
      if (source.battlefieldIndex === null) return [];
      return Object.values(game.instances).filter((i) => {
        const c = getCard(i.cardId);
        return (
          i.controller === otherPlayer(source.controller) &&
          (c.type === "unit" || c.type === "champion") &&
          i.battlefieldIndex === source.battlefieldIndex
        );
      });
    default:
      return [];
  }
}

/**
 * Resolves a target spec to concrete instances: explicit player choice (onPlay/activated-ability
 * moves, validated against illegal picks by moves.ts's rejectsInvalidTemplatedTarget before this
 * ever runs) first, else deterministic auto-pick for every OTHER trigger (onConquer/onHold/
 * onAttack/onDefend/onMove/onDestroy — no player-facing pause exists for those yet, see the
 * top-of-file doc comment). The one exception: an `optional` ("you may...") spec with no explicit
 * choice means the player deliberately skipped it — auto-picking a target anyway would silently
 * do the opposite of what they chose, not just what "no choice offered" already risks elsewhere.
 */
function resolveTargets(
  game: GameState,
  getCard: (id: string) => Card,
  source: CardInstance,
  spec: TemplatedTargetSpec,
  explicitTargetInstanceId: string | undefined,
): CardInstance[] {
  if (spec.kind === "allEnemyUnitsAtBattlefield") return candidatesForTarget(game, getCard, source, spec);
  if (spec.kind === "self") return [source];

  const candidates = candidatesForTarget(game, getCard, source, spec);
  if (explicitTargetInstanceId) {
    const explicit = candidates.find((c) => c.instanceId === explicitTargetInstanceId);
    if (explicit) return [explicit];
  }
  if (spec.optional) return [];
  return candidates.length > 0 ? [candidates[0]] : [];
}

function runAction(
  game: GameState,
  getCard: (id: string) => Card,
  source: CardInstance,
  action: TemplatedAction,
  explicitTargetInstanceId: string | undefined,
): void {
  const controller = game.players[source.controller];

  switch (action.type) {
    case "buffMight": {
      for (const target of resolveTargets(game, getCard, source, action.target, explicitTargetInstanceId)) {
        if (action.duration === "permanent") {
          // Non-stacking: a unit either has the Buff status or doesn't (see might.ts).
          target.statuses.buffed = true;
        } else {
          target.tempMightBonus += action.amount;
        }
      }
      return;
    }
    case "dealDamage": {
      for (const target of resolveTargets(game, getCard, source, action.target, explicitTargetInstanceId)) {
        target.damage += action.amount;
        const card = getCard(target.cardId);
        if (card.might !== null && target.damage >= card.might + target.tempMightBonus) {
          destroyInstance(game, getCard, target.instanceId);
        }
      }
      return;
    }
    case "killTarget": {
      for (const target of resolveTargets(game, getCard, source, action.target, explicitTargetInstanceId)) {
        destroyInstance(game, getCard, target.instanceId);
      }
      return;
    }
    case "recallTarget": {
      for (const target of resolveTargets(game, getCard, source, action.target, explicitTargetInstanceId)) {
        const owner = game.players[target.controller];
        if (target.battlefieldIndex !== null) {
          const slot = game.battlefields[target.battlefieldIndex];
          slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== target.instanceId);
        }
        owner.base = owner.base.filter((id) => id !== target.instanceId);
        owner.hand.push(target.cardId);
        delete game.instances[target.instanceId];
      }
      return;
    }
    case "readyTarget": {
      for (const target of resolveTargets(game, getCard, source, action.target, explicitTargetInstanceId)) {
        target.exhausted = false;
      }
      return;
    }
    case "drawCards": {
      for (let i = 0; i < action.amount; i += 1) {
        const drawn = controller.mainDeck.shift();
        if (drawn) controller.hand.push(drawn);
      }
      return;
    }
    case "discardCards": {
      // No player choice of which card yet (documented simplification): discards from the front of hand.
      for (let i = 0; i < action.amount; i += 1) {
        const discarded = controller.hand.shift();
        if (discarded) discardCardToTrash(game, getCard, source.controller, discarded);
      }
      return;
    }
    case "scorePoints": {
      controller.points += action.amount;
      if (controller.points >= 8) game.winner = source.controller;
      return;
    }
    case "gainXP": {
      controller.xp += action.amount;
      return;
    }
    case "channelRunes": {
      for (let i = 0; i < action.amount; i += 1) {
        const rune = controller.runeDeck.shift();
        if (rune) controller.runePool.push(rune);
      }
      return;
    }
    case "gainRune": {
      for (let i = 0; i < action.amount; i += 1) {
        game.nextInstanceSeq += 1;
        controller.runePool.push({
          instanceId: `rune-gained-${game.nextInstanceSeq}`,
          domain: action.domain,
          exhausted: false,
        });
      }
      return;
    }
  }
}

/** Runs a list of TemplatedActions for `source` — shared by triggered effects and activated abilities. */
export function runTemplatedActions(
  game: GameState,
  getCard: (id: string) => Card,
  source: CardInstance,
  actions: TemplatedAction[],
  explicitTargetInstanceId?: string,
): void {
  for (const action of actions) {
    runAction(game, getCard, source, action, explicitTargetInstanceId);
  }
}

/** Fires a card's TemplatedEffect if its trigger matches (also matching onAttackOrDefend against onAttack/onDefend). */
export function fireTemplatedEffect(
  game: GameState,
  getCard: (id: string) => Card,
  card: Card,
  instance: CardInstance,
  trigger: TemplatedTrigger,
  explicitTargetInstanceId?: string,
): void {
  const effect = card.templatedEffect;
  if (!effect) return;
  const matches =
    effect.trigger === trigger ||
    (effect.trigger === "onAttackOrDefend" && (trigger === "onAttack" || trigger === "onDefend"));
  if (!matches) return;

  runTemplatedActions(game, getCard, instance, effect.actions, explicitTargetInstanceId);
}
