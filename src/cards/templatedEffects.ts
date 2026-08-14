import type { Domain } from "./types";

/**
 * Data schema for auto-matched, data-driven card effects (see
 * scripts/match-templated-effects.mjs and src/game/templatedEffects.ts for
 * the interpreter). A TemplatedEffect is "when TRIGGER happens, do ACTIONS" —
 * covers the minority of special-case cards whose text reduces cleanly to a
 * known trigger + a short list of simple primitive actions. Everything else
 * stays in special-cases-todo.json for bespoke implementation.
 */
export type TemplatedTrigger =
  | "onPlay"
  | "onConquer"
  | "onHold"
  | "onAttack"
  | "onDefend"
  | "onAttackOrDefend"
  | "onMove"
  | "onDestroy";

export type TemplatedTargetKind =
  | "self"
  | "chooseUnit"
  | "chooseFriendlyUnit"
  | "chooseEnemyUnit"
  | "chooseFriendlyGear"
  | "allEnemyUnitsAtBattlefield";

export interface TemplatedTargetSpec {
  kind: TemplatedTargetKind;
  /** Restrict candidates to units at the same battlefield as the source instance. */
  atBattlefieldOnly?: boolean;
}

export type TemplatedAction =
  | { type: "buffMight"; target: TemplatedTargetSpec; amount: number; duration: "thisTurn" | "permanent" }
  | { type: "dealDamage"; target: TemplatedTargetSpec; amount: number }
  | { type: "killTarget"; target: TemplatedTargetSpec }
  | { type: "recallTarget"; target: TemplatedTargetSpec }
  | { type: "readyTarget"; target: TemplatedTargetSpec }
  | { type: "drawCards"; player: "controller"; amount: number }
  | { type: "discardCards"; player: "controller"; amount: number }
  | { type: "scorePoints"; player: "controller"; amount: number }
  | { type: "gainXP"; player: "controller"; amount: number }
  | { type: "channelRunes"; player: "controller"; amount: number }
  | { type: "gainRune"; player: "controller"; domain: Domain; amount: number };

export interface TemplatedEffect {
  trigger: TemplatedTrigger;
  actions: TemplatedAction[];
}

/** True if any action in the effect needs a player-chosen target (relevant only for onPlay, where we have a target-picker UI). */
export function templatedEffectNeedsPlayTarget(effect: TemplatedEffect | undefined): boolean {
  if (!effect || effect.trigger !== "onPlay") return false;
  return effect.actions.some((a) => "target" in a && a.target.kind.startsWith("choose"));
}

/**
 * Auto-matched "[Cost,] Exhaust: Effect" activated ability (see
 * scripts/match-activated-abilities.mjs). Cost is Energy + optionally one
 * Rune of a specific Domain (recycled, same as a card's Power cost) +
 * exhausting the card itself. No sacrifice costs (e.g. "Kill this:").
 */
export interface ActivatedAbility {
  cost: {
    energy: number;
    exhaustSelf: boolean;
    runeDomain?: Domain;
    recycleFromTrash?: number;
    spendBuff?: boolean;
    killSelf?: boolean;
    discardCount?: number;
    spendXP?: number;
  };
  actions: TemplatedAction[];
}

export function activatedAbilityNeedsTarget(ability: ActivatedAbility | undefined): boolean {
  if (!ability) return false;
  return ability.actions.some((a) => "target" in a && a.target.kind.startsWith("choose"));
}
