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
  /** Active status/keyword flags, e.g. "stunned", "empowered", "everEmpowered". Cleared per rules per keyword, not globally. */
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
}

export interface BattlefieldSlot {
  cardId: string;
  /** instanceIds of units each player has committed to this battlefield. */
  units: Record<PlayerId, string[]>;
  controller: PlayerId | null;
}

export type Phase = "awaken" | "beginning" | "channel" | "draw" | "main";

export interface GameState {
  players: Record<PlayerId, PlayerState>;
  battlefields: BattlefieldSlot[];
  /** Single source of truth for every CardInstance currently in play (base, battlefield, or champion zone). */
  instances: Record<string, CardInstance>;
  turnPhase: Phase;
  activePlayer: PlayerId;
  winner: PlayerId | null;
  nextInstanceSeq: number;
}
