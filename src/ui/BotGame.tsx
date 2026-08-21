import { useMemo } from "react";
import { Client } from "boardgame.io/react";
import { Local } from "boardgame.io/multiplayer";
import { RiftboundGame } from "../game/game";
import { Board } from "./Board";
import { createBotClass } from "../ai/boardgameBot";
import type { BotTier } from "../ai/bots";
import type { PlayerId } from "../game/state";

/**
 * "vs Bot" match: a real boardgame.io `Local({ bots })` transport (see ai/boardgameBot.ts's file
 * doc comment for why this — boardgame.io's native bot-integration point — replaces an earlier
 * "second headless Client" approach that crashed on redacted opponent-hand data). Built fresh per
 * match (not the shared ui/client.ts `RiftboundClient`, which has no `bots` option and stays the
 * plain human-vs-human local-hotseat client) since `botPlayerId`/`tier` are per-match choices.
 */
export function BotGame({
  matchId,
  humanPlayerId,
  botPlayerId,
  tier,
}: {
  matchId: string;
  humanPlayerId: PlayerId;
  botPlayerId: PlayerId;
  tier: BotTier;
}) {
  const GameClient = useMemo(
    () =>
      Client({
        game: RiftboundGame,
        board: Board,
        multiplayer: Local({ bots: { [botPlayerId]: createBotClass(tier) } }),
        debug: false,
      }),
    [botPlayerId, tier],
  );

  return <GameClient playerID={humanPlayerId} matchID={matchId} />;
}
