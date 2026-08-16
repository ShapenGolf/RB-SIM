import { useMemo } from "react";
import { Client } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import { RiftboundGame } from "../game/game";
import { Board } from "./Board";
import type { OnlineSession } from "./onlineLobby";

/**
 * Real cross-network match: each browser runs its own `OnlineGame`, talking to the shared
 * server (see server/index.ts) over the SocketIO transport instead of sharing an in-process
 * `Local()` master (see ui/client.ts's `RiftboundClient`, used for same-screen hotseat play).
 * The Client component is memoized on `server` since `Client()` does real setup work and must
 * not be recreated on every render.
 */
export function OnlineGame({ server, matchID, playerID, credentials }: OnlineSession) {
  const Online = useMemo(
    () =>
      Client({
        game: RiftboundGame,
        board: Board,
        multiplayer: SocketIO({ server }),
        debug: false,
      }),
    [server],
  );
  return <Online playerID={playerID} matchID={matchID} credentials={credentials} />;
}
