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
  | "onDestroy"
  | "onBecameReady";

export type TemplatedTargetKind =
  | "self"
  | "chooseUnit"
  | "chooseFriendlyUnit"
  | "chooseEnemyUnit"
  | "chooseFriendlyGear"
  | "allEnemyUnitsAtBattlefield";

export interface TemplatedTargetSpec {
  kind: TemplatedTargetKind;
  /** Restrict candidates to units at the same battlefield as the source instance — card text "...a unit here" (e.g. Crackshot Corsair: "When I attack, deal 1 to an enemy unit here."). Distinct from anyBattlefieldOnly below — don't confuse the two when hand-authoring or pattern-matching a new card. */
  atBattlefieldOnly?: boolean;
  /** Restrict candidates to units at ANY battlefield (i.e. not in Base), independent of the source's own location — card text "...a unit at a battlefield" (e.g. Hextech Ray: "Deal 3 to a unit at a battlefield."). A hand-cast spell has no battlefield of its own (source.battlefieldIndex is always null), so this must NOT be confused with atBattlefieldOnly — that would make the target spec unsatisfiable for every hand-cast spell using this phrasing (this was a real bug: scripts/lib/action-patterns.mjs used to fold both phrasings into one atBattlefieldOnly flag). */
  anyBattlefieldOnly?: boolean;
  /**
   * Set for "you may [target something]" text (e.g. Grim Apothecary: "you may return a friendly
   * unit"), as opposed to a plain "[target something]" — matters for moves.ts's server-side target
   * validation: skipping the choice entirely is always legal here, even with candidates on board,
   * unlike a mandatory target (see rejectsInvalidTemplatedTarget). Never set by the auto-matcher on
   * its own — hand-verified per card, since "may" also shows up in unrelated reminder text (e.g.
   * "[Flow] ... You may play this from your trash") that has nothing to do with target optionality.
   */
  optional?: boolean;
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
 * The spec for the (single) player-chosen target an action list needs, if any — used to compute
 * real eligible candidates for the UI's target picker and to validate a move's targetInstanceId
 * server-side (see game/templatedEffectEngine.ts's candidatesForTarget and moves.ts's playCard/
 * playFromHidden/activateAbility). No auto-matched card currently mixes two DIFFERENT "choose"
 * target kinds in one action list (verified against the generated data), so "the first one found"
 * is unambiguous today; this only picks the first, so it would silently misrepresent a future card
 * that broke that assumption — the auto-matcher would need to reject such cards instead.
 */
export function firstChooseTargetSpec(actions: TemplatedAction[]): TemplatedTargetSpec | undefined {
  const found = actions.find((a) => "target" in a && a.target.kind.startsWith("choose"));
  return found && "target" in found ? found.target : undefined;
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
