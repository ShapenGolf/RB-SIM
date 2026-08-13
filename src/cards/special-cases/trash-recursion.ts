import { getCard } from "../db";
import type { GameState, PlayerId } from "../../game/state";

/**
 * Shared "return a unit from your trash to your hand" effect (Cemetery Attendant, Morbid
 * Return, and any future card with the same text). No player choice of which unit — returns
 * the first one found (see docs/data-sourcing.md discard-choice simplification).
 */
export function returnUnitFromTrashToHand(game: GameState, controller: PlayerId): void {
  const player = game.players[controller];
  const idx = player.trash.findIndex((cardId) => {
    const t = getCard(cardId).type;
    return t === "unit" || t === "champion";
  });
  if (idx === -1) return;
  const [cardId] = player.trash.splice(idx, 1);
  player.hand.push(cardId);
}
