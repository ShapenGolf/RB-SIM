import type { Card, Domain } from "../types";
import type { CardInstance, GameState, PlayerId } from "../../game/state";

export interface SpecialCaseContext {
  game: GameState;
  card: Card;
  instance: CardInstance;
}

/** Shape shared by `empowerCost`; see its doc comment on `SpecialCaseHandler` below. */
export interface EmpowerCost {
  energy: number;
  runeDomain?: Domain;
  exhaustSelf?: boolean;
  /** "Discard N" as part of this cost (e.g. Punching Poro: "Discard 1"). No choice of which card (see docs/data-sourcing.md discard-choice simplification) — discards from the front of hand. */
  discardCount?: number;
  /** "Kill a friendly unit" as part of this cost (e.g. Escaped Grayback: "[Empower] — Kill a friendly unit"). No choice of which unit (see docs/data-sourcing.md) — kills the controller's own weakest OTHER unit; the move is rejected if none exists. */
  killFriendlyUnit?: boolean;
}

/** Shape shared by `activatedAbilityCost`; see its doc comment on `SpecialCaseHandler` below. */
export interface ActivatedAbilityCost {
  energy: number;
  runeDomain?: Domain;
  exhaustSelf: boolean;
  /** Recycle N cards from the front of your trash (no choice of which — see docs/data-sourcing.md discard-choice simplification) as part of this ability's cost. */
  recycleFromTrash?: number;
  /** "Spend my buff" as part of this ability's cost — requires the instance to already be buffed, consumed by clearing statuses.buffed. */
  spendBuff?: boolean;
  /** "Kill this:" as the cost itself (vs. Treasure Trove-style "...Exhaust: Kill this", where killing is the EFFECT). The instance is destroyed before onActivate runs. */
  killSelf?: boolean;
  /** "Discard N" as part of this ability's cost (e.g. Gutter Palace: "Discard 1, Exhaust: ..."). No choice of which card (see docs/data-sourcing.md discard-choice simplification) — discards from the front of hand via discardCardToTrash. */
  discardCount?: number;
  /** "Spend N XP" as part of this ability's cost (e.g. Crowd Favorite: "Spend 2 XP: [Buff] me."), paid from this instance's own CardInstance.xp counter (Hunt/Level pool), not the controller's player-level XP. */
  spendXP?: number;
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

  /** Called for each of this instance's Showdowns as a defender, before combat damage is assigned — alongside the generic onDefend templated trigger (see game/combat.ts resolveCombat). */
  onDefend?(ctx: SpecialCaseContext): void;

  /** Called on this instance if it's still alive right after a real Showdown resolves (i.e. it "won" the combat by remaining — see Nidalee, Cat Form). Not called for an unopposed conquest (no Showdown took place). */
  onSurviveCombat?(ctx: SpecialCaseContext): void;

  /** Called on every board instance the OPPONENT of the scoring player owns, whenever that player scores points at their Beginning step (e.g. Sumpworks Map: "When an opponent scores, draw 1."). */
  onOpponentScored?(ctx: SpecialCaseContext, scoredPoints: number): void;

  /**
   * Called whenever this instance moves onto a Battlefield via `attackBattlefield` — the initial
   * attack from base AND any subsequent Ganking move both count, matching the generic
   * `onMove` templated trigger fired at the same call site (see game/moves.ts). Runs right after
   * `onAttack`.
   */
  onMove?(ctx: SpecialCaseContext): void;

  /** Called for every unit a player holds a Battlefield with, at their Beginning step — alongside the generic onHold templated trigger. */
  onHold?(ctx: SpecialCaseContext): void;

  /** Called for every instance a player controls at the end of their own turn, just before it passes to the opponent. */
  onEndOfTurn?(ctx: SpecialCaseContext): void;

  /** Called on this instance right after it moves from a Battlefield to its controller's base, via any source (see move-helpers.ts moveInstanceToBase, the shared chokepoint for non-attack moves-to-base). Not called for a move that started already in base. */
  onMoveFromBattlefield?(ctx: SpecialCaseContext): void;

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

  /**
   * True if, while this is in play, other friendly units entering play should enter ready
   * instead of exhausted. `newInstance` is the card actually entering play, for handlers that
   * only care about a subset of it (e.g. Renata Glasc, Industrialist: "Your tokens enter
   * ready.", checked via `newInstance.cardId`'s setCode/tags).
   */
  othersEnterReady?(ctx: SpecialCaseContext, newInstance: CardInstance): boolean;

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

  /**
   * Broadcast to every board instance the OPPONENT of the player who just played a card owns
   * (e.g. Vex, Apathetic: "When an opponent plays a unit while I'm at a battlefield, [Stun]
   * it."). `playedInstance` is the just-created instance — for a spell, it has already been
   * removed from `game.instances` by the time this fires, though the object reference itself is
   * still valid (only relevant to handlers that check `playedCard.type` first).
   */
  onEnemyCardPlayed?(ctx: SpecialCaseContext, playedCard: Card, playedInstance: CardInstance): void;

  /**
   * Broadcast to every board instance the controller owns whenever a token is created for them
   * via the shared token-helpers.ts `playTokenHere`/`playTokenToBase` (e.g. Lillia, Protector of
   * Dreams: "When you play a token unit, give me +1 Might this turn."). Unlike
   * `onAllyCardPlayed`, tokens never go through the hand-paid `playCard` move, so they need this
   * separate hook to be seen at all.
   */
  onAllyTokenPlayed?(ctx: SpecialCaseContext, tokenCard: Card, tokenInstance: CardInstance): void;

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
   * Optional "spend N of your (player-level) XP as an additional cost" cost reduction, paid via
   * the existing `payAdditionalCost` play flag — same spirit as `additionalCostDiscardForReduction`
   * but spending the controller's XP pool (Hunt/Level currency) instead of hand cards (e.g.
   * Poppy, Defender of the Meek: "You may spend 3 XP as an additional cost to play me. If you
   * do, I cost 3 Energy less.").
   */
  readonly additionalCostXPForReduction?: { xpCost: number; energyReduction: number };

  /**
   * Always-evaluated Energy cost reduction for playing this card itself (e.g. Legion:
   * "I cost 2 Energy less" once another card has already been played this turn). Unlike
   * `additionalCostDiscardForReduction`, this isn't gated behind an opt-in additional cost.
   */
  costReduction?(ctx: SpecialCaseContext): number;

  /** True if this card can't be played at all right now (e.g. Ol' Poro: "I can't be played on your first, second, or third turns."). Checked in game/moves.ts playCard. */
  blocksSelfPlay?(ctx: SpecialCaseContext): boolean;

  /** True if this spell should be banished instead of trashed once it finishes resolving (e.g. Time Warp: "Banish this"). Spells only. */
  banishSelfOnResolve?(ctx: SpecialCaseContext): boolean;

  /** True if this instance conditionally has Ganking (move battlefield to battlefield) right now, beyond its printed keywords (e.g. Bilgewater Bully: "While I'm buffed, I have Ganking"). */
  hasConditionalGanking?(ctx: SpecialCaseContext): boolean;

  /** True if this unit/champion may be played directly to a Battlefield where the OPPONENT has units (e.g. Deadbloom Predator: "You may play me to an occupied enemy battlefield"). Distinct from Ambush, which requires the controller's OWN units there. */
  allowsPlayToEnemyOccupiedBattlefield?(ctx: SpecialCaseContext): boolean;

  /** True if this unit/champion may be played directly to a Battlefield where the opponent has EXACTLY ONE unit (e.g. Arachnoid Horror: "I can be played to an occupied battlefield if an enemy unit is alone there."). The "alone" check itself is done by the caller (registry.ts allowsPlayToLoneEnemyBattlefield) before this is consulted. */
  allowsPlayToLoneEnemyBattlefield?(ctx: SpecialCaseContext): boolean;

  /** True if, while this is in play, OTHER friendly units may be played to a Battlefield where the opponent has exactly one unit (e.g. Arachnoid Horror: "Friendly units can be played to an occupied battlefield if an enemy unit is alone there."). */
  grantsOthersPlayToLoneEnemyBattlefield?(ctx: SpecialCaseContext): boolean;

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
   * Energy cost INCREASE this card's static presence imposes on an ENEMY card about to be
   * played (e.g. Helm of Suppression: "Opponents' spells cost 1 Energy more."). `playedCard` is
   * the card being played, not this source card.
   */
  costIncreaseForEnemy?(ctx: SpecialCaseContext, playedCard: Card): number;

  /**
   * Energy cost reduction for a spell about to be played, if THIS instance is the spell's
   * chosen target (e.g. Irelia, Graceful: "Your spells that choose me cost 1 Energy or Rune
   * less."). Checked in game/moves.ts playCard against `args.targetInstanceId` before the
   * target is otherwise validated. Known gap: only the Energy component is charged, matching
   * the Domain-Rune-only-cost skip convention elsewhere (see docs/data-sourcing.md).
   */
  costReductionIfTargetedBySpell?(ctx: SpecialCaseContext, playedCard: Card): number;

  /**
   * Cost for a bespoke "[Cost,] Exhaust: Effect" activated ability whose effect can't be
   * expressed as fixed-amount TemplatedActions (e.g. "deal damage equal to my Might") — the
   * data-driven `Card.activatedAbility` (see cards/templatedEffects.ts) covers the fixed-amount
   * case; this covers the rest. `activateAbility` in moves.ts checks both. May be a plain cost
   * or a function of the live game state, for cards like Bashful Bloom ("4 Energy... This
   * ability costs 1 Energy less for each friendly unit with Temporary.") — same spirit as
   * `empowerCost` below.
   */
  readonly activatedAbilityCost?: ActivatedAbilityCost | ((ctx: SpecialCaseContext) => ActivatedAbilityCost);

  /**
   * Cost for this card's own "[Empower] [Cost]: Empower me/this. Use only if not Empowered."
   * ability — a player-triggerable action (see game/moves.ts `empowerInstance`) that pays the
   * cost, then sets `statuses.empowered`/`everEmpowered`. The generic `empowered` keyword handler
   * only tracks the resulting status flags and the once-per-game constraint (see
   * keywords/handlers/empowered.ts `canBecomeEmpowered`) — this is what actually lets a player
   * trigger it, since the granted effect and the cost are both unique per card. May be a plain
   * cost or a function of the live game state, for cards like Frostcoat Mother ("12 Energy. This
   * ability costs 1 Energy less for each rune you control.").
   */
  readonly empowerCost?: EmpowerCost | ((ctx: SpecialCaseContext) => EmpowerCost);

  /** Set when the bespoke activated ability needs a player-chosen target. */
  readonly activateNeedsTarget?: boolean;

  /** Executes a bespoke activated ability's effect. */
  onActivate?(ctx: SpecialCaseContext, targetInstanceId?: string): void;

  /** Called on this instance right after it becomes Empowered via the player-triggered `empowerInstance` move (see game/moves.ts), for a one-shot effect distinct from the ongoing `[Empowered]` bonus (e.g. Kharox, Tail-Cloaked Matriarch: "When I become Empowered, ..."). */
  onBecomeEmpowered?(ctx: SpecialCaseContext): void;

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
   * `conqueringUnitIds` are the instanceIds of the conquering side's committed units still
   * sitting at this Battlefield (e.g. Sunken Temple: "...with one or more [Mighty] units...").
   * `excessDamage` is the attacking side's unassignable leftover combat damage this Showdown
   * (0 if conquered with no defenders present — see combat.ts `assignDamage`), e.g. Trapping
   * Grounds: "...if you assigned 3 or more excess damage...".
   */
  onConquerHere?(ctx: SpecialCaseContext, conqueringUnitIds: string[], excessDamage: number): void;

  /**
   * Battlefield-only: called once per Battlefield in play, for a player's very first Beginning
   * Phase only, regardless of who controls that Battlefield (e.g. Obelisk of Power: "At the
   * start of each player's first Beginning Phase, that player channels 1 rune."). `ctx.instance`
   * is a pseudo-instance and `ctx.instance.controller` is the player whose first Beginning Phase
   * this is (not necessarily this Battlefield's controller).
   */
  onFirstBeginningPhase?(ctx: SpecialCaseContext): void;

  /**
   * Battlefield-only: called once per Battlefield in play, at the start of EVERY player's
   * Beginning Phase, regardless of who controls that Battlefield (e.g. Frozen Fortress: "At the
   * start of each player's Beginning Phase, deal 1 to each unit here."). Unlike
   * `onFirstBeginningPhase`, this fires every turn, not just the player's first.
   */
  onEveryBeginningPhase?(ctx: SpecialCaseContext): void;

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
   * Battlefield-only: Might modifier this Battlefield grants to units sitting at it, but only
   * while they're defending here (e.g. Black Flame Altar: "Units here with [Temporary] have
   * [Shield]." — +1 Might, defending only). Checked in game/might.ts `computeMight` alongside
   * staticMightModifierForUnitsHere, but only when `role === "defending"`.
   */
  defendingMightModifierForUnitsHere?(ctx: SpecialCaseContext, targetInstance: CardInstance): number;

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

  /**
   * Called on the WEARER when an Equipment gear is attached to it, from any source — the
   * player-initiated `equipGear` move or a card effect (Weaponmaster, Rell's attack trigger,
   * etc.) — see game/equip.ts `attachEquipment`, the sole attach chokepoint. `gearInstance` is
   * the Equipment that was just attached.
   */
  onEquip?(ctx: SpecialCaseContext, gearInstance: CardInstance): void;

  /**
   * Extra Energy that may optionally be paid to play this card, for a bonus effect on top of
   * the normal play (e.g. Sea Monkey: "You may pay 1 Energy as an additional cost to play me.
   * When you play me, if you paid the additional cost, buff me."). Opted into via the existing
   * `payAdditionalCost` play flag (same as Accelerate/discard-reduction) — read the outcome via
   * `ctx.instance.statuses.paidAdditionalCostThisTurn` inside `onPlay`. Same spirit as
   * `KeywordHandler.additionalPlayCostEnergy` but for cards without a dedicated keyword;
   * summed with it in moves.ts/ui/autoPay.ts, not mutually exclusive. Simplification consistent
   * with Accelerate: only the Energy component is charged, any Domain-Rune part of the printed
   * cost is not (see docs/data-sourcing.md).
   */
  additionalPlayCostEnergy?(ctx: SpecialCaseContext): number;

  /**
   * Battlefield-only: true if units/champions can't be played directly to this Battlefield at
   * all (e.g. Rockfall Path: "Units can't be played here."), overriding every other play-
   * destination permission (Ambush, enemy-occupied grants, open-battlefield grants). Checked in
   * game/moves.ts `playCard` for the chosen `ambushBattlefieldIndex`.
   */
  blocksUnitsPlayedHere?(ctx: SpecialCaseContext): boolean;

  /**
   * Battlefield-only: true if `ctx.instance.controller` (the player attempting to score) can't
   * score from holding this specific Battlefield right now (e.g. Forgotten Monument: "Players
   * can't score here until their third turn.").
   */
  blocksScoringHere?(ctx: SpecialCaseContext): boolean;

  /**
   * True if, while this instance is in play, the OPPONENT of its controller can't score points
   * at all, from any Battlefield (e.g. Tianna Crownguard: "While I'm at a battlefield, opponents
   * can't score points."). Checked against every instance the scoring player's opponent
   * controls.
   */
  blocksOpponentScoring?(ctx: SpecialCaseContext): boolean;

  /**
   * True if `doomedInstance` (a Temporary instance about to be killed by the Beginning Phase's
   * killTemporaryInstances sweep) should survive instead, because of this instance's own printed
   * text (e.g. LeBlanc, Everywhere at Once: "Your [Temporary] effects at my battlefield don't
   * trigger."). Checked against every OTHER instance the doomed instance's own controller owns —
   * "Your" in the reminder text means the doomed unit's controller, matching LeBlanc's controller.
   */
  preventsTemporaryDeath?(ctx: SpecialCaseContext, doomedInstance: CardInstance): boolean;

  /** True if this instance deals no combat damage at all (e.g. Galio, Indefatigable: "I don't deal combat damage."), on top of whatever the generic Stun keyword already covers via KeywordEngine.preventsCombatDamage. */
  preventsCombatDamage?(ctx: SpecialCaseContext): boolean;

  /** True if this instance's static presence stops a given ENEMY instance from dealing combat damage (e.g. Vilemaw: "Enemy units here with less Might than me don't deal combat damage."). Checked against every enemy instance the same way staticMightModifierForEnemy is. */
  preventsCombatDamageForEnemy?(ctx: SpecialCaseContext, enemyInstance: CardInstance): boolean;

  /** True if this instance can't be readied during its controller's Awaken step (e.g. Maduli the Gatekeeper: "I can't be readied."). Checked in turnFlow.ts runAwaken. */
  preventsSelfReady?(ctx: SpecialCaseContext): boolean;

  /**
   * True if this instance's presence — a self-restriction (e.g. Determined Sentry: "I can't move
   * to base", checked via `targetInstance.instanceId === ctx.instance.instanceId`) or an ambient
   * one affecting every unit (e.g. Minotaur Reckoner: "Units can't move to base", ignoring
   * `targetInstance`) — stops `targetInstance` from moving to its base. Checked against every
   * in-play instance, see cards/special-cases/move-helpers.ts `moveInstanceToBase`.
   */
  preventsMoveToBase?(ctx: SpecialCaseContext, targetInstance: CardInstance): boolean;

  /** Battlefield-only: true if units can't move from here to base (e.g. Vilemaw's Lair: "Units can't move from here to base."). */
  blocksUnitsMovedToBaseFromHere?(ctx: SpecialCaseContext): boolean;

  /** True if this instance is immune to damage from ENEMY spells/abilities right now (e.g. Esteemed Hierophant: "While you control 7 or more runes, prevent all damage that enemy spells and abilities would deal to me."). Checked in game/spellDamage.ts dealSpellDamage — only consulted when the damage source's controller differs from this instance's controller. */
  preventsEnemySpellDamage?(ctx: SpecialCaseContext): boolean;

  /**
   * Broadcast to every board instance (and the Legend, via its pseudo-instance) the WINNING
   * player of a real Showdown (both sides had committed units) controls, right after that
   * Showdown resolves (e.g. Glorious Executioner: "When you win a combat, draw 1. (You win if
   * only your units remain after combat.)"). Not called for an unopposed conquest (no
   * defenders present — see combat.ts resolveCombat's early return) or a Showdown where both or
   * neither side has survivors.
   */
  onWinCombat?(ctx: SpecialCaseContext): void;

  /**
   * Called on every board instance (and the Legend, via its pseudo-instance) of the player who
   * CONTROLS a Battlefield, once for each enemy unit that attacks it, before combat resolves
   * (e.g. Nine-Tailed Fox: "When an enemy unit attacks a battlefield you control, give it -1
   * Might this turn, to a minimum of 1 Might."). `attackingInstance` is the attacker.
   */
  onEnemyAttackHere?(ctx: SpecialCaseContext, attackingInstance: CardInstance): void;

  /**
   * Called on every board instance sitting at a Battlefield (both controllers) right when an
   * attack is declared there — before combat resolves — regardless of whether this instance is
   * attacking or defending (e.g. Diana, Lunari: "When a showdown begins here, you may pay 1
   * Energy..."). See game/moves.ts attackBattlefield.
   */
  onShowdownBegin?(ctx: SpecialCaseContext): void;

  /**
   * Caps how many runes ANY player channels at the start of their Channel Phase, if lower than
   * the default amount (e.g. Sandstone Chimera: "While I'm at a battlefield, players only
   * channel 1 rune at the start of their Channel Phase."). Checked in turnFlow.ts runChannel
   * against every in-play instance regardless of controller; the lowest cap found (if any) wins.
   */
  channelAmountCap?(ctx: SpecialCaseContext): number;

  /**
   * True if this card's mere presence converts points a player WOULD score (from holding, in
   * this engine's simplified single scoring step) into a card draw instead, for BOTH players,
   * while that player is on their first or second turn (e.g. Otterpus). Checked in
   * turnFlow.ts runBeginning against every in-play instance regardless of controller; the
   * turn-count gate itself is applied by the caller, not this hook.
   */
  convertsScoringToDrawOnEarlyTurns?(ctx: SpecialCaseContext): boolean;

  /** True if this card's mere presence makes its OWN controller skip their Draw Phase entirely (e.g. Endless Riches: "Skip your Draw Phase."). Checked in turnFlow.ts runDraw only against instances the drawing player themself controls. */
  blocksOwnDrawPhase?(ctx: SpecialCaseContext): boolean;
}
