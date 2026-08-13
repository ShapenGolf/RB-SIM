import { getCard } from "../cards/db";
import { createInstance } from "./setup";
import { resolvePlayedCard } from "./moves";
import type { GameState, PlayerId } from "./state";

/**
 * Plays `cardId` for `controller` ignoring its Energy/Power cost — for "banish a unit, then
 * play it ignoring its cost" / "reveal ... and play it, ignoring its cost" effects (a recurring
 * pattern across ~16 cards). Runs the same resolution pipeline as a normal hand-paid play.
 * Callers are responsible for removing the card from wherever it came from (hand/trash/deck)
 * before calling this — it only instantiates and resolves.
 */
export function playCardIgnoringCost(
  game: GameState,
  controller: PlayerId,
  cardId: string,
  targetInstanceId?: string,
): void {
  const card = getCard(cardId);
  if (card.type === "rune" || card.type === "legend" || card.type === "battlefield") return;
  const player = game.players[controller];
  const instance = createInstance(game, cardId, controller);
  resolvePlayedCard(game, player, card, instance, targetInstanceId, false);
}
