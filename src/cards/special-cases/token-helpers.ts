import { createInstance } from "../../game/setup";
import { getCard } from "../db";
import { SpecialCaseEngine } from "./registry";
import type { CardInstance, GameState, PlayerId } from "../../game/state";

/** Applies any ambient "enters ready" grant (e.g. Renata Glasc, Industrialist: "Your tokens enter ready.") to a just-created token. */
function applyAmbientReady(game: GameState, token: CardInstance): void {
  if (SpecialCaseEngine.othersEnterReadyFor(game, getCard, token)) token.exhausted = false;
}

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
  applyAmbientReady(game, token);
  return token;
}

/** Creates a token instance and places it directly into `controller`'s base. */
export function playTokenToBase(game: GameState, tokenId: string, controller: PlayerId): CardInstance {
  const token = createInstance(game, tokenId, controller);
  game.players[controller].base.push(token.instanceId);
  applyAmbientReady(game, token);
  return token;
}
