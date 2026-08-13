import type { Card, Domain } from "../types";
import type { CardInstance, GameState, PlayerId } from "../../game/state";

export interface SpecialCaseContext {
  game: GameState;
  card: Card;
  instance: CardInstance;
}

/**
 * Card-specific behavior for cards whose text isn't fully covered by the
 * generic keyword engine. Each hook is optional; only implement what the
 * card actually needs. Register new special cases in `registry.ts`.
 */
export interface SpecialCaseHandler {
  readonly cardId: string;

  /**
   * Set when `onPlay` needs a player-chosen target instance (drives the
   * target-picker UI in Board.tsx). Omit/false for untargeted or non-onPlay
   * handlers — don't forget this, or the card silently plays with no target.
   */
  readonly needsPlayTarget?: boolean;

  /** Called when the card is played, after generic keyword `onPlay` hooks. */
  onPlay?(ctx: SpecialCaseContext, targetInstanceId?: string): void;

  /** Called when the card instance is destroyed, after generic Deathknell handling. */
  onDestroy?(ctx: SpecialCaseContext): void;

  /**
   * Called when this instance Conquers a Battlefield (after control/points are already updated).
   * `excessDamage` is the attacking side's unassignable leftover combat damage this Showdown
   * (0 if the Battlefield was conquered with no defenders present) — see combat.ts `assignDamage`.
   */
  onConquer?(ctx: SpecialCaseContext, excessDamage: number): void;

  /** Called when this instance attacks (moved onto a Battlefield as an attacker), before combat resolves — alongside the generic onAttack templated trigger. */
  onAttack?(ctx: SpecialCaseContext): void;

  /**
   * Might bonus this Gear/static-effect card grants to a given ally unit
   * instance while it attacks. Only relevant for Gear/Battlefield cards
   * with a controller-wide static bonus.
   */
  attackingMightBonusForAlly?(ctx: SpecialCaseContext, allyInstance: CardInstance): number;

  /** Called at the controller's Beginning step while this Battlefield is held by them. */
  onBeginningWhileHeld?(ctx: SpecialCaseContext): void;

  /** Continuous self Might modifier independent of attacking/defending (e.g. an active Empowered bonus). */
  staticMightModifier?(ctx: SpecialCaseContext): number;

  /** Conditional self Might modifier while attacking (e.g. "+2 Might while attacking alone"), on top of any printed Assault. */
  attackingMightModifier?(ctx: SpecialCaseContext): number;

  /** Conditional self Might modifier while defending, on top of any printed Shield. */
  defendingMightModifier?(ctx: SpecialCaseContext): number;

  /** True if, while this is in play, other friendly units entering play should enter ready instead of exhausted. */
  othersEnterReady?(ctx: SpecialCaseContext): boolean;

  /**
   * Broadcast to every board instance the controller owns whenever THAT PLAYER plays any card
   * (this instance included) — for "when you play a/your Nth card..." effects that react to
   * something other than their own being played. `playedCard` is the card that was just played;
   * `playCountThisTurn` is 1 for the first card that player played this turn, 2 for the second, etc.
   */
  onAllyCardPlayed?(ctx: SpecialCaseContext, playedCard: Card, playCountThisTurn: number): void;

  /** Broadcast to every board instance the controller owns whenever THAT PLAYER stuns an enemy unit (see cards/special-cases/stun.ts `applyStun`). */
  onAllyStun?(ctx: SpecialCaseContext, stunnedInstance: CardInstance): void;

  /**
   * Optional "discard N as an additional cost" cost reduction, paid via the existing
   * `payAdditionalCost` play flag (see keywords/handlers/accelerate.ts for the "pay more"
   * counterpart). Choosing to pay it discards `discardCount` cards from the front of hand
   * (see docs/data-sourcing.md discard-choice simplification — no player choice of which
   * card yet) and reduces this card's Energy cost by `energyReduction`, floored at 0.
   */
  readonly additionalCostDiscardForReduction?: { discardCount: number; energyReduction: number };

  /**
   * Always-evaluated Energy cost reduction for playing this card itself (e.g. Legion:
   * "I cost 2 Energy less" once another card has already been played this turn). Unlike
   * `additionalCostDiscardForReduction`, this isn't gated behind an opt-in additional cost.
   */
  costReduction?(ctx: SpecialCaseContext): number;

  /**
   * Cost for a bespoke "[Cost,] Exhaust: Effect" activated ability whose effect can't be
   * expressed as fixed-amount TemplatedActions (e.g. "deal damage equal to my Might") — the
   * data-driven `Card.activatedAbility` (see cards/templatedEffects.ts) covers the fixed-amount
   * case; this covers the rest. `activateAbility` in moves.ts checks both.
   */
  readonly activatedAbilityCost?: {
    energy: number;
    runeDomain?: Domain;
    exhaustSelf: boolean;
    /** Recycle N cards from the front of your trash (no choice of which — see docs/data-sourcing.md discard-choice simplification) as part of this ability's cost. */
    recycleFromTrash?: number;
  };

  /** Set when the bespoke activated ability needs a player-chosen target. */
  readonly activateNeedsTarget?: boolean;

  /** Executes a bespoke activated ability's effect. */
  onActivate?(ctx: SpecialCaseContext, targetInstanceId?: string): void;

  /**
   * Broadcast to every card in the controller's trash whenever THAT PLAYER kills an enemy unit
   * with a spell (see game/spellDamage.ts `dealSpellDamage`, the one place spell damage should
   * be applied from). No SpecialCaseContext — a trashed card has no live CardInstance — so this
   * gets the raw game/player/cardId instead. Typically used with `offerOptionalCost` below (e.g.
   * Immortal Phoenix: "you may pay 1 Energy+Fury Rune to play me from your trash").
   */
  onTrashKillWithSpell?(
    game: GameState,
    playerId: PlayerId,
    cardId: string,
    killedInstance: CardInstance,
  ): void;

  /**
   * Resolves a "you may pay X to Y" reactive decision this handler offered via
   * SpecialCaseEngine.offerOptionalCost (see game/moves.ts `resolveOptionalCost`). Runs after the
   * cost has already been paid. `payload` is whatever string the offering call attached (e.g. a
   * trash cardId to play). No SpecialCaseContext — by resolution time the offering source may no
   * longer have a live instance (e.g. it was in the trash to begin with).
   */
  onOptionalCostPaid?(game: GameState, playerId: PlayerId, payload?: string): void;
}
