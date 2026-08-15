import type { Domain, KeywordInstance } from "../cards/types";

export type PlayerId = "0" | "1";

export type InstanceZone = "base" | "battlefield" | "championZone";

/**
 * A concrete copy of a card in play. Multiple instances can share the same
 * `cardId`. This is the single source of truth for any card once it leaves
 * hand/deck; `PlayerState.base` and `BattlefieldSlot.units` only ever store
 * `instanceId` references into `GameState.instances`.
 */
export interface CardInstance {
  instanceId: string;
  cardId: string;
  controller: PlayerId;
  zone: InstanceZone;
  /** Index into `GameState.battlefields`, set only while `zone === "battlefield"`. */
  battlefieldIndex: number | null;
  damage: number;
  exhausted: boolean;
  /**
   * Active status/keyword flags, e.g. "stunned", "empowered", "everEmpowered". Cleared per
   * rules per keyword, not globally — EXCEPT any key ending in "ThisTurn" (convention for
   * one-off per-instance-per-turn gates, e.g. "wraith of echoes already drew this turn"),
   * which turnFlow.ts's runTurnStart auto-clears for the controller every Awaken.
   */
  statuses: Record<string, boolean>;
  /** XP counters, used by Level/Hunt. */
  xp: number;
  /** Temporary Might bonus granted by other cards' effects "for the rest of the turn". Reset at Awaken. */
  tempMightBonus: number;
  /**
   * Keywords granted to this instance "this turn" by another card's effect (e.g. "Give a unit
   * Assault 3 this turn."), on top of whatever's printed on the card itself. Consumed by
   * KeywordEngine exactly like printed keywords (see registry.ts `contextsFor`). Reset at Awaken.
   */
  grantedThisTurn: KeywordInstance[];
  /** instanceIds of Equipment gear currently attached to this unit/champion (see game/equip.ts). Empty for non-unit instances and for gear that isn't itself Equipment. */
  equipment: string[];
  /** XP the controller gains if this instance survives ("wins") a Showdown this turn, e.g. Grim Resolve: "When it wins a combat this turn, gain 2 XP." Granted by another card's effect rather than this instance's own printed text, so it's a plain number rather than a keyword grant. Consumed (and reset to 0) the moment it pays out in game/combat.ts resolveCombat, and also reset at Awaken. */
  pendingSurviveCombatXP: number;
  /** For an Equipment gear instance: the unit/champion instanceId it's attached to, or null if unattached (sitting in base normally). Always null for non-Equipment cards. */
  attachedTo: string | null;
}

export interface RuneInstance {
  instanceId: string;
  domain: Domain;
  exhausted: boolean;
}

/**
 * A player's Legend, in play for the whole game (see cards/deckValidation.ts DeckList.legendId).
 * No Might/damage/combat participation — just an exhaust-gated ability source, reusing the
 * SpecialCaseHandler activatedAbilityCost/onActivate hooks via a pseudo CardInstance (see
 * game/pseudoInstance.ts legendPseudoInstance) rather than a full game.instances entry.
 * Null when the game was set up via the domain-cycling MVP fallback (no real DeckList known).
 */
export interface LegendState {
  cardId: string;
  exhausted: boolean;
}

export interface PlayerState {
  id: PlayerId;
  mainDeck: string[];
  hand: string[];
  trash: string[];
  banishment: string[];
  /** instanceIds of units/gear/champions on this player's base (in play, not on a battlefield). */
  base: string[];
  runeDeck: RuneInstance[];
  runePool: RuneInstance[];
  legend: LegendState | null;
  points: number;
  /** Set true once a non-Rune "Main Deck" card has been played this turn (used by Legion). */
  playedMainDeckCardThisTurn: boolean;
  /** Controller-level XP pool, gained via Hunt and spent on Champion Level-ups. */
  xp: number;
  /** Set by Vision while a predict (look-at-top-card) decision is pending. */
  pendingPredict: boolean;
  /** True once this player has completed their first turn (used for the second player's +1 Channel rule). */
  hasTakenFirstTurn: boolean;
  /** Set true once this player has discarded a card this turn (e.g. "If you've discarded a card this turn, ..."). Reset at Awaken. */
  discardedCardThisTurn: boolean;
  /** Count of cards this player has played this turn, for "when you play your second card..." effects. Reset at Awaken. */
  cardsPlayedThisTurn: number;
  /** One-shot: the next unit/champion this player plays this turn enters ready. Consumed on use, reset at Awaken. */
  nextUnitEntersReady: boolean;
  /** One-shot: the next unit/champion this player plays this turn is buffed (e.g. Nami, Headstrong: "the next time you play a unit this turn, ready it and [Buff] it."). Consumed on use, reset at Awaken. */
  nextUnitBuffed: boolean;
  /** One-shot: Energy cost reduction applied to the next spell this player plays this turn. Consumed on use, reset at Awaken. */
  nextSpellCostReduction: number;
  /** One-shot: Energy cost reduction applied to the next card of ANY type this player plays this turn (e.g. Astral Heron: "your next card costs 2 Energy less"). Consumed on use, reset at Awaken. */
  nextCardCostReduction: number;
  /** One-shot: Bonus damage added to every dealSpellDamage instance of the next spell this player plays this turn (see game/spellDamage.ts). Consumed once that spell finishes resolving, reset at Awaken. */
  nextSpellBonusDamage: number;
  /** Persistent-for-the-turn (not consumed on first use, unlike nextUnitEntersReady): every unit/champion this player plays this turn enters ready. Reset at Awaken. */
  unitsEnterReadyThisTurn: boolean;
  /** Persistent-for-the-turn: every friendly unit/champion this player plays this turn is buffed (e.g. Rally the Troops: "When a friendly unit is played this turn, buff it."). Reset at Awaken. */
  buffUnitsPlayedThisTurn: boolean;
  /** Set true whenever an ENEMY unit/champion (from this player's perspective) dies, e.g. for "if an enemy unit has died this turn, ..." effects. Reset at Awaken. */
  enemyUnitDiedThisTurn: boolean;
  /** Delayed effect: this many exhausted runes in the pool are readied at the end of THIS turn (see moves.ts endTurn), e.g. Targon's Peak: "ready 2 runes at the end of this turn." Consumed by endTurn, not by Awaken. */
  readyRunesAtEndOfTurn: number;
  /** Count of turns this player has started (their own turns only), 1-indexed from their first turn. Incremented in turnFlow.ts runTurnStart, e.g. for "can't score until your third turn" effects. */
  turnsTaken: number;
  /** Set true if a unit this player controls died while game.turnPhase === "beginning" during this player's own Beginning step. Reset at the start of runTurnStart, before Beginning runs (unlike most "ThisTurn" flags, which reset after), so it survives through this player's own Main Phase for effects like Shadow Watcher: "If a friendly unit died during your Beginning Phase this turn, I enter ready." */
  friendlyUnitDiedDuringBeginningThisTurn: boolean;
  /** Set true once this player has played a spell card this turn, e.g. for "if you've played a spell this turn, ..." effects like Crescent Guardian. Reset at Awaken. */
  playedSpellThisTurn: boolean;
  /** Highest actual Energy cost (after all reductions) this player has paid for a single spell this turn, e.g. for "if you've spent 4+ Energy to play a spell this turn, ..." effects like Prepared Neophyte. Reset at Awaken. */
  maxEnergySpentOnSpellThisTurn: number;
  /** True once this player has resolved their opening mulligan (see moves.ts `mulligan`) — gates the pregame "mulligan" phase in game/game.ts, which both players must clear before turn 1 begins. */
  mulliganDone: boolean;
  /** The 3 Battlefields this player's DeckList submitted (see cards/deckValidation.ts) — the pool `chooseBattlefield` picks from. Empty for the domain-cycling MVP fallback (no real DeckList), which skips the "battlefieldSelect" phase instead. */
  battlefieldPool: string[];
  /** The one Battlefield from `battlefieldPool` this player has chosen to bring to the table (see moves.ts `chooseBattlefield`), or null before they've picked. Gates the pregame "battlefieldSelect" phase in game/game.ts. */
  chosenBattlefieldId: string | null;
}

export interface BattlefieldSlot {
  cardId: string;
  /** instanceIds of units each player has committed to this battlefield. */
  units: Record<PlayerId, string[]>;
  controller: PlayerId | null;
}

export type Phase = "awaken" | "beginning" | "channel" | "draw" | "main";

/**
 * A live "you may pay X to Y" reactive decision offered to a player (e.g. Immortal Phoenix:
 * "When you kill a unit with a spell, you may pay 1 Energy+Fury Rune to play me from your
 * trash."). Set via SpecialCaseEngine.offerOptionalCost, resolved by the `resolveOptionalCost`
 * move, which pays the cost (if accepted) and calls the offering handler's `onOptionalCostPaid`.
 * Only one can be pending at a time — the engine has no trigger stack/priority system.
 */
export interface PendingOptionalCost {
  playerId: PlayerId;
  /** specialCaseId of the handler to resolve against (see cards/special-cases/registry.ts getSpecialCaseHandlerById). */
  specialCaseId: string;
  cost: { energy: number; runeDomain?: Domain };
  /** Arbitrary bookkeeping the offering handler needs at resolution time (e.g. a trash cardId). */
  payload?: string;
}

export interface GameState {
  players: Record<PlayerId, PlayerState>;
  battlefields: BattlefieldSlot[];
  /** Single source of truth for every CardInstance currently in play (base, battlefield, or champion zone). */
  instances: Record<string, CardInstance>;
  turnPhase: Phase;
  activePlayer: PlayerId;
  winner: PlayerId | null;
  nextInstanceSeq: number;
  pendingOptionalCost: PendingOptionalCost | null;
  /** Set by "take a turn after this one" effects (e.g. Time Warp) — game.ts's turn.order.next reads this to repeat the same player instead of alternating, then clears it in onBegin once consumed. */
  extraTurnFor: PlayerId | null;
  /** True once any unit/champion (either player's) has died this turn, e.g. Towering Pairofant: "If a unit died this turn, I enter ready." Set in combat.ts destroyInstance, reset in turnFlow.ts runTurnStart — global, not per-player, unlike PlayerState.enemyUnitDiedThisTurn. */
  anyUnitDiedThisTurn: boolean;
}
