import { createInstance } from "../../game/setup";
import type { CardInstance, GameState, PlayerId } from "../../game/state";

/**
 * Creates a token instance and places it "here" — at the same location as `source` (its
 * Battlefield if it's there, otherwise the controller's base). Shared by every "play a unit
 * token here" effect (Sprite Mother, Faithful Manufactor, Vanguard Captain, ...).
 */
export function playTokenHere(game: GameState, tokenId: string, controller: PlayerId, source: CardInstance): CardInstance {
  const token = createInstance(game, tokenId, controller);
  if (source.zone === "battlefield" && source.battlefieldIndex !== null) {
    token.zone = "battlefield";
    token.battlefieldIndex = source.battlefieldIndex;
    game.battlefields[source.battlefieldIndex].units[controller].push(token.instanceId);
  } else {
    game.players[controller].base.push(token.instanceId);
  }
  return token;
}
