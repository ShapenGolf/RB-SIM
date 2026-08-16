import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance, GameState, PlayerId } from "../../game/state";

/**
 * Flags the controller's strongest unit/champion to be recalled (to base, exhausted, healed)
 * instead of dying the next time it would this turn — see game/combat.ts destroyInstance's
 * `preventNextDeathThisTurn` check, the single chokepoint every death goes through. Shared by
 * highlander.ts and tactical-retreat.ts (identical printed effect). Simplification: no player
 * choice of which unit (see docs/data-sourcing.md).
 */
export function protectStrongestUnit(game: GameState, controller: PlayerId): void {
  let target: CardInstance | undefined;
  for (const instance of Object.values(game.instances)) {
    if (instance.controller !== controller) continue;
    const t = getCard(instance.cardId).type;
    if (t !== "unit" && t !== "champion") continue;
    if (!target || computeMight(game, getCard, instance, "none") > computeMight(game, getCard, target, "none")) {
      target = instance;
    }
  }
  if (target) target.statuses.preventNextDeathThisTurn = true;
}
