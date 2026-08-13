import type { Card } from "../types";
import type { CardInstance, GameState, PlayerId } from "../../game/state";
import { SpecialCaseEngine } from "./registry";

/** Applies Stun and fires the onAllyStun broadcast for the stunning player's board — the one place stun should be applied from. */
export function applyStun(
  game: GameState,
  getCard: (id: string) => Card,
  target: CardInstance,
  stunningController: PlayerId,
): void {
  target.statuses.stunned = true;
  SpecialCaseEngine.onAllyStun(game, getCard, stunningController, target);
}
