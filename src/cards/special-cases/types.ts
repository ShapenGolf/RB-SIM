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

  /** Called for every unit a player holds a Battlefield with, at their Beginning step — alongside the generic onHold templated trigger. */
  onHold?(ctx: SpecialCaseContext): void;

  /** Called for every instance a player controls at the end of their own turn, just before it passes to the opponent. */
  onEndOfTurn?(ctx: SpecialCaseContext): void;

  /**
   * Might bonus this Gear/static-effect card grants to a given ally unit
   * instance while it attacks. Only relevant for Gear/Battlefield cards
   * with a controller-wide static bonus.
   */
  attackingMightBonusForAlly?(ctx: SpecialCaseContext, allyInstance: CardInstance): number;

  /** Same as `attackingMightBonusForAlly`, but while the ally defends. */
  defendingMightBonusForAlly?(ctx: SpecialCaseContext, allyInstance: CardInstance): number;

  /** Called at the controller's Beginning step while this Battlefield is held by them. */
  onBeginningWhileHeld?(ctx: SpecialCaseContext): void;

  /** Called for every instance the controller owns at the start of their own Beginning step (before scoring), regardless of Battlefield control — unlike onBeginningWhileHeld, which is Battlefield-only. */
  onBeginning?(ctx: SpecialCaseContext): void;

  /**
   * Broadcast to every OTHER board instance the controller owns whenever one of their own
   * units/champions dies, from any source (see game/combat.ts destroyInstance, the sole
   * destruction chokepoint). Note: if this instance is itself the one that died, it does NOT
   * receive its own broadcast (it's already removed from game.instances by the time this
   * fires) — a documented edge case, not a general limitation.
   */
  onAllyUnitDied?(ctx: SpecialCaseContext, diedInstance: CardInstance): void;

  /** Continuous self Might modifier independent of attacking/defending (e.g. an active Empowered bonus). */
  staticMightModifier?(ctx: SpecialCaseContext): number;

  /** Conditional self Might modifier while attacking (e.g. "+2 Might while attacking alone"), on top of any printed Assault. */
  attackingMightModifier?(ctx: SpecialCaseContext): number;

  /** Conditional self Might modifier while defending, on top of any printed Shield. */
  defendingMightModifier?(ctx: SpecialCaseContext): number;

  /** True if, while this is in play, other friendly units entering play should enter ready instead of exhausted. */
  othersEnterReady?(ctx: SpecialCaseContext): boolean;

  /** Conditional self "enters ready instead of exhausted" check, evaluated when this card itself is played (e.g. "If an opponent's score is within 3 of the Victory Score, I enter ready"). */
  selfEntersReady?(ctx: SpecialCaseContext): boolean;

  /** Continuous Might modifier this card's static presence applies to a given ENEMY instance, independent of attacking/defending role (e.g. "Stunned enemy units here have -8 Might"). */
  staticMightModifierForEnemy?(ctx: SpecialCaseContext, enemyInstance: CardInstance): number;

  /** Continuous Might modifier this card's static presence applies to a given ALLY instance, independent of attacking/defending role (e.g. "Other buffed friendly units at my battlefield have +2 Might"). */
  staticMightModifierForAlly?(ctx: SpecialCaseContext, allyInstance: CardInstance): number;

  /**
   * Broadcast to every board instance the controller owns whenever THAT PLAYER plays any card
   * (this instance included) — for "when you play a/your Nth card..." effects that react to
   * something other than their own being played. `playedCard` is the card that was just played;
   * `playCountThisTurn` is 1 for the first card that player played this turn, 2 for the second, etc.
   */
  onAllyCardPlayed?(ctx: SpecialCaseContext, playedCard: Card, playCountThisTurn: number): void;

  /** Broadcast to every board instance the controller owns whenever THAT PLAYER stuns an enemy unit (see cards/special-cases/stun.ts `applyStun`). */
  onAllyStun?(ctx: SpecialCaseContext, stunnedInstance: CardInstance): void;

  /** Broadcast to every board instance the controller owns whenever THAT PLAYER discards a card, from any source (see game/discardEngine.ts `discardCardToTrash`). */
  onAllyDiscard?(ctx: SpecialCaseContext): void;

  /** Broadcast to every board instance the controller owns whenever THAT PLAYER kills an enemy unit, from any source (combat or spell damage) — see game/combat.ts destroyInstance call sites. `killedInstance` reflects its statuses at the moment of death. */
  onAllyKillUnit?(ctx: SpecialCaseContext, killedInstance: CardInstance): void;

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

  /** True if this spell should be banished instead of trashed once it finishes resolving (e.g. Time Warp: "Banish this"). Spells only. */
  banishSelfOnResolve?(ctx: SpecialCaseContext): boolean;

  /** True if this instance conditionally has Ganking (move battlefield to battlefield) right now, beyond its printed keywords (e.g. Bilgewater Bully: "While I'm buffed, I have Ganking"). */
  hasConditionalGanking?(ctx: SpecialCaseContext): boolean;

  /** True if this unit/champion may be played directly to a Battlefield where the OPPONENT has units (e.g. Deadbloom Predator: "You may play me to an occupied enemy battlefield"). Distinct from Ambush, which requires the controller's OWN units there. */
  allowsPlayToEnemyOccupiedBattlefield?(ctx: SpecialCaseContext): boolean;

  /** True if this unit/champion may be played directly to a Battlefield where NEITHER side has units (e.g. Sai Scout: "You may play me to an open battlefield"). */
  allowsPlayToOpenBattlefield?(ctx: SpecialCaseContext): boolean;

  /** True if, while this is in play, OTHER friendly units may be played to open Battlefields (e.g. Miss Fortune, Buccaneer: "Friendly units may be played to open battlefields"). */
  grantsOthersPlayToOpenBattlefield?(ctx: SpecialCaseContext): boolean;

  /**
   * Energy cost reduction this card's static presence grants to ANOTHER card of the controller's
   * that's about to be played (e.g. Eager Apprentice: "spells you play cost 1 Energy less while
   * I'm at a battlefield"). `playedCard` is the card being played, not this source card.
   */
  costReductionForAlly?(ctx: SpecialCaseContext, playedCard: Card): number;

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
    /** "Spend my buff" as part of this ability's cost — requires the instance to already be buffed, consumed by clearing statuses.buffed. */
    spendBuff?: boolean;
    /** "Kill this:" as the cost itself (vs. Treasure Trove-style "...Exhaust: Kill this", where killing is the EFFECT). The instance is destroyed before onActivate runs. */
    killSelf?: boolean;
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

  /**
   * Called when THIS card is discarded from hand, by any source — see game/discardEngine.ts
   * `discardCardToTrash`, the sole discard chokepoint. No SpecialCaseContext — a discarded card
   * has no live CardInstance (it was in hand, not in play).
   */
  onSelfDiscarded?(game: GameState, playerId: PlayerId): void;

  /**
   * True if this card should recycle itself (go to the bottom of its owner's Main Deck) instead
   * of the trash when it dies (e.g. Ekko, Recurrent: "[Deathknell] — Recycle me..."). Checked in
   * game/combat.ts `destroyInstance` right after the normal trash push, which it then undoes.
   */
  recycleSelfOnDestroy?(ctx: SpecialCaseContext): boolean;

  /**
   * Battlefield-only: called on the controller who just conquered this Battlefield, right after
   * control/points/per-unit onConquer effects resolve (e.g. Sigil of the Storm: "When you
   * conquer here, recycle one of your runes."). `ctx.instance` is a pseudo-instance (see
   * game/pseudoInstance.ts) since Battlefields have no CardInstance of their own.
   */
  onConquerHere?(ctx: SpecialCaseContext): void;

  /**
   * Battlefield-only: called once per Battlefield in play, for a player's very first Beginning
   * Phase only, regardless of who controls that Battlefield (e.g. Obelisk of Power: "At the
   * start of each player's first Beginning Phase, that player channels 1 rune."). `ctx.instance`
   * is a pseudo-instance and `ctx.instance.controller` is the player whose first Beginning Phase
   * this is (not necessarily this Battlefield's controller).
   */
  onFirstBeginningPhase?(ctx: SpecialCaseContext): void;

  /**
   * Battlefield-only: how many extra points this Battlefield's mere presence in play adds to
   * the score needed to win (e.g. Aspirant's Climb: "Increase the points needed to win the game
   * by 1."), regardless of who controls it. Summed across every Battlefield in play.
   */
  winScoreIncrease?(ctx: SpecialCaseContext): number;

  /**
   * Battlefield-only: continuous Might modifier this Battlefield grants to EVERY unit sitting at
   * it, regardless of controller (e.g. Trifarian War Camp: "Units here have +1 Might."). Checked
   * in game/might.ts `computeMight` for any instance whose zone is this Battlefield.
   */
  staticMightModifierForUnitsHere?(ctx: SpecialCaseContext, targetInstance: CardInstance): number;

  /**
   * Battlefield-only: true if this Battlefield grants Ganking to every unit sitting at it,
   * regardless of controller (e.g. Windswept Hillock: "Units here have Ganking."). Only
   * consulted when the printed/conditional Ganking checks are both absent — same override
   * precedence as `hasConditionalGanking`.
   */
  grantsGankingToUnitsHere?(ctx: SpecialCaseContext): boolean;

  /**
   * Battlefield-only: extra spell damage applied to a unit sitting at this Battlefield (e.g.
   * Void Gate: "Spells and abilities affecting units here each deal 1 Bonus Damage."). Checked
   * in game/spellDamage.ts `dealSpellDamage` for the target's current Battlefield.
   */
  spellDamageBonusForUnitsHere?(ctx: SpecialCaseContext, targetInstance: CardInstance): number;

  /**
   * Battlefield-only: called once per Showdown where this Battlefield's controller-to-be
   * defends here, right after per-unit onDefend triggers but before combat damage is assigned
   * (e.g. Fortified Position: "When you defend here, choose a unit. It gains [Shield 2] this
   * combat."). `defenderIds` are the defending side's committed unit instance IDs.
   * `ctx.instance.controller` is the defending player.
   */
  onDefendHere?(ctx: SpecialCaseContext, defenderIds: string[]): void;

  /**
   * Continuous bonus this card's mere presence adds to EVERY instance of spell/ability damage
   * its controller deals, anywhere (e.g. Annie, Fiery: "Your spells and abilities deal 1 Bonus
   * Damage."). Summed across the controller's whole board in game/spellDamage.ts
   * `dealSpellDamage` — distinct from the one-shot `nextSpellBonusDamage` PlayerState flag.
   */
  staticSpellDamageBonus?(ctx: SpecialCaseContext): number;
}
