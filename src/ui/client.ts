import { Client } from "boardgame.io/react";
import { Local } from "boardgame.io/multiplayer";
import { RiftboundGame } from "../game/game";
import { Board } from "./Board";

/**
 * Local hotseat client: two instances (one per `playerID`) share a single
 * in-browser game master via boardgame.io's `Local` transport. This is the
 * "play locally before enabling online multiplayer" step from the project
 * brief — swapping `Local()` for `SocketIO({ server })` later is the whole
 * online-multiplayer migration.
 */
export const RiftboundClient = Client({
  game: RiftboundGame,
  board: Board,
  multiplayer: Local(),
  debug: true,
});
