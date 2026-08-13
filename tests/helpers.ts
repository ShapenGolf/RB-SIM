import { setupGame, createInstance } from "../src/game/setup";
import type { GameState, PlayerId } from "../src/game/state";

/** A deterministic, mostly-empty GameState for isolated unit tests. */
export function makeGame(): GameState {
  const game = setupGame({
    player0Domains: ["Mind", "Fury"],
    player1Domains: ["Mind", "Fury"],
    battlefieldCardIds: ["battlefield-ancient-ruins", "battlefield-ancient-ruins"],
  });
  // Clear randomized decks/hands so tests control exactly what's in play.
  for (const playerId of ["0", "1"] as PlayerId[]) {
    game.players[playerId].hand = [];
    game.players[playerId].runePool = [];
  }
  return game;
}

/** Places a fresh instance of `cardId` directly on `controller`'s base, bypassing playCard payment. */
export function putOnBase(game: GameState, cardId: string, controller: PlayerId, opts?: { exhausted?: boolean }) {
  const instance = createInstance(game, cardId, controller);
  instance.exhausted = opts?.exhausted ?? false;
  game.players[controller].base.push(instance.instanceId);
  return instance;
}
