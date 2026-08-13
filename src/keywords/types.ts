import type { Card, KeywordInstance } from "../cards/types";
import type { CardInstance, GameState } from "../game/state";

/** Everything a keyword handler needs to answer questions about one card instance. */
export interface KeywordContext {
  game: GameState;
  card: Card;
  instance: CardInstance;
  /** The specific KeywordInstance entry (carries `value`/`grantedText`) that matched this handler. */
  keyword: KeywordInstance;
}

/**
 * One generic rule handler per Riftbound keyword. A handler only implements
 * the hooks relevant to its keyword; all hooks are optional. The engine
 * calls every matching hook across all of a card's keywords and combines
 * the results (sums for numeric modifiers, ORs for booleans).
 */
export interface KeywordHandler {
  readonly name: string;

  /** Might delta applied while this instance is attacking (e.g. Assault). */
  attackingMightModifier?(ctx: KeywordContext): number;

  /** Might delta applied while this instance is defending (e.g. Shield). */
  defendingMightModifier?(ctx: KeywordContext): number;

  /** True if this instance deals no combat damage this turn (Stun). */
  preventsCombatDamage?(ctx: KeywordContext): boolean;

  /** True if a card with this keyword may be played to a battlefield the opponent already occupies (Ambush). */
  allowsPlayToOccupiedBattlefield?(ctx: KeywordContext): boolean;

  /** True if this keyword grants the card Reaction-speed timing under its current circumstances. */
  grantsReactionTiming?(ctx: KeywordContext): boolean;

  /** True if a Legion-style conditional trigger should fire for this play. */
  conditionalTriggerActive?(ctx: KeywordContext): boolean;

  /** Additional optional-cost energy that may be paid as this card is played (Accelerate). */
  additionalPlayCostEnergy?(ctx: KeywordContext): number;

  /** Whether paying the additional cost causes the card to enter play ready rather than exhausted. */
  entersReadyIfCostPaid?(ctx: KeywordContext): boolean;

  /** XP granted to the controller when this instance Conquers or Holds a Battlefield (Hunt). */
  xpOnConquerOrHold?(ctx: KeywordContext): number;

  /** Extra Rune(s) an opponent must pay/recycle to legally target this instance (Deflect). */
  extraTargetingCost?(ctx: KeywordContext): number;

  /** Called once when this instance is destroyed, after healing, before it leaves the battlefield (Deathknell). Generic hook only fires an event; unique payloads belong in special-case handlers. */
  onDestroy?(ctx: KeywordContext): void;

  /** Called immediately when this instance is played (Vision: predict). */
  onPlay?(ctx: KeywordContext): void;
}
