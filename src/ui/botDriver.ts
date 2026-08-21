import { Client } from "boardgame.io/client";
import { Local } from "boardgame.io/multiplayer";
import { RiftboundGame } from "../game/game";
import { chooseBotAction, type BotTier } from "../ai/bots";
import type { PlayerId } from "../game/state";

export interface BotDriverHandle {
  stop: () => void;
}

/** How long the bot "thinks" between actions — purely a UX pacing choice, not computation time (chooseBotAction itself is effectively instant), so the human can actually follow what just happened instead of the board flickering through a whole turn at once. */
const THINK_MS = 600;

/**
 * Headless boardgame.io client for the BOT's seat, sharing the same in-browser Local() master as
 * the human's rendered client (see ui/client.ts) via a common matchID — the same "two clients, one
 * shared master" pattern local hotseat already uses, just with this side driven by ai/bots.ts
 * instead of a second human. Subscribes to state changes and, whenever it becomes the bot's
 * turn/window (ai/enumerate.ts's isBotTurn, checked inside chooseBotAction), dispatches its next
 * move after a short "thinking" delay, then re-checks — a turn is usually several moves, not one.
 */
export function startBotDriver(matchID: string, botPlayerId: PlayerId, tier: BotTier): BotDriverHandle {
  const client = Client({ game: RiftboundGame, multiplayer: Local(), matchID, playerID: botPlayerId });
  client.start();

  let acting = false;
  let stopped = false;

  function maybeAct() {
    if (stopped || acting) return;
    const state = client.getState();
    if (!state) return;
    const action = chooseBotAction(tier, state.G, state.ctx, botPlayerId);
    if (!action) return;
    acting = true;
    setTimeout(() => {
      if (!stopped) {
        const move = client.moves[action.move];
        if (typeof move === "function") move(action.args);
      }
      acting = false;
      maybeAct();
    }, THINK_MS);
  }

  const unsubscribe = client.subscribe(() => {
    if (!acting) maybeAct();
  });
  maybeAct();

  return {
    stop: () => {
      stopped = true;
      unsubscribe();
      client.stop();
    },
  };
}
