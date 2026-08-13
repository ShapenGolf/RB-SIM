import type { Card } from "../cards/types";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import type { GameState, PlayerId } from "./state";

/**
 * Discards `cardId` for `controller`: pushes it to trash, flags discardedCardThisTurn, and
 * fires the onSelfDiscarded broadcast — the one place a card's move from hand to trash-via-
 * discard should happen, so cards reacting to "when I'm discarded" (Scrapheap) see every
 * discard regardless of source. Callers pick which card (usually the front of hand — no player
 * choice modeled, see docs/data-sourcing.md) and remove it from hand themselves first.
 */
export function discardCardToTrash(
  game: GameState,
  getCard: (id: string) => Card,
  controller: PlayerId,
  cardId: string,
): void {
  const player = game.players[controller];
  player.trash.push(cardId);
  player.discardedCardThisTurn = true;
  SpecialCaseEngine.onSelfDiscarded(game, getCard, controller, cardId);
  SpecialCaseEngine.onAllyDiscard(game, getCard, controller);
}
