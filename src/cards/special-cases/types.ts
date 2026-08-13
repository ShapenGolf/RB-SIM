import type { Card } from "../types";
import type { CardInstance, GameState } from "../../game/state";

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
   * Might bonus this Gear/static-effect card grants to a given ally unit
   * instance while it attacks. Only relevant for Gear/Battlefield cards
   * with a controller-wide static bonus.
   */
  attackingMightBonusForAlly?(ctx: SpecialCaseContext, allyInstance: CardInstance): number;

  /** Called at the controller's Beginning step while this Battlefield is held by them. */
  onBeginningWhileHeld?(ctx: SpecialCaseContext): void;

  /** Continuous self Might modifier independent of attacking/defending (e.g. an active Empowered bonus). */
  staticMightModifier?(ctx: SpecialCaseContext): number;

  /** True if, while this is in play, other friendly units entering play should enter ready instead of exhausted. */
  othersEnterReady?(ctx: SpecialCaseContext): boolean;
}
