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
}

export interface RuneInstance {
  instanceId: string;
  domain: Domain;
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
  /** One-shot: Energy cost reduction applied to the next spell this player plays this turn. Consumed on use, reset at Awaken. */
  nextSpellCostReduction: number;
  /** One-shot: Bonus damage added to every dealSpellDamage instance of the next spell this player plays this turn (see game/spellDamage.ts). Consumed once that spell finishes resolving, reset at Awaken. */
  nextSpellBonusDamage: number;
  /** Persistent-for-the-turn (not consumed on first use, unlike nextUnitEntersReady): every unit/champion this player plays this turn enters ready. Reset at Awaken. */
  unitsEnterReadyThisTurn: boolean;
  /** Set true whenever an ENEMY unit/champion (from this player's perspective) dies, e.g. for "if an enemy unit has died this turn, ..." effects. Reset at Awaken. */
  enemyUnitDiedThisTurn: boolean;
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
}
