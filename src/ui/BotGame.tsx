import { useEffect } from "react";
import { RiftboundClient } from "./client";
import { startBotDriver } from "./botDriver";
import type { BotTier } from "../ai/bots";
import type { PlayerId } from "../game/state";

/**
 * "vs Bot" match: renders a single RiftboundClient for the human's seat (see ui/client.ts) and,
 * for the bot's seat, a headless driver (ui/botDriver.ts) instead of a second rendered client —
 * the local-hotseat "two clients share one Local() master" pattern (ui/App.tsx's "game" screen),
 * just with one side driven by ai/bots.ts instead of a second human at the same screen.
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
  useEffect(() => {
    const handle = startBotDriver(matchId, botPlayerId, tier);
    return () => handle.stop();
  }, [matchId, botPlayerId, tier]);

  return <RiftboundClient playerID={humanPlayerId} matchID={matchId} />;
}
