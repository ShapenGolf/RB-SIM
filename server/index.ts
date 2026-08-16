import type { Game } from "boardgame.io";
import { Server, Origins } from "boardgame.io/server";
import { RiftboundGame } from "../src/game/game";

/**
 * Online-multiplayer server: hosts the boardgame.io match state (SocketIO transport + Lobby
 * REST API for create/join) that ui/client.ts's online mode connects to. Match state is kept
 * in-memory (boardgame.io's default) — fine for casual play, but a server restart or a free-tier
 * host's idle sleep loses in-progress matches. Swap in a real StorageAPI (e.g. `FlatFile` from
 * `boardgame.io/server`, or a Postgres/Redis adapter) here later if that becomes a problem.
 *
 * CORS: `ALLOWED_ORIGIN` should be the deployed frontend's exact origin (e.g.
 * `https://shapengolf.github.io`) so the browser is allowed to talk to this server at all;
 * localhost is always allowed for local dev. Multiple origins can be comma-separated.
 */
const extraOrigins = (process.env.ALLOWED_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const server = Server({
  // `Server`'s `games` array is intentionally loosely typed (it hosts arbitrary games), so
  // RiftboundGame's own strong `G`/`SetupData` types need a cast here — see boardgame.io's own
  // TypeScript examples for the same pattern.
  games: [RiftboundGame as unknown as Game],
  origins: [Origins.LOCALHOST, Origins.LOCALHOST_IN_DEVELOPMENT, "https://shapengolf.github.io", ...extraOrigins],
});

const port = Number(process.env.PORT) || 8000;
server.run(port, () => {
  console.log(`Riftbound multiplayer server listening on :${port}`);
});
