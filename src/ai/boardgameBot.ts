import { Bot } from "boardgame.io/ai";
import type { Ctx, PlayerID } from "boardgame.io";
import type { GameState, PlayerId } from "../game/state";
import { enumerateBotActionsOrFallback } from "./enumerate";
import { pickBotActionIndex, type BotTier } from "./bots";

/**
 * boardgame.io's NATIVE bot-integration point (`Game.ai.enumerate` + `Local({ bots })`, see
 * game/game.ts and ui/BotGame.tsx) — not a second headless `Client` instance driving its own
 * moves (an earlier version of this file did that, and it crashed: a second client only ever sees
 * its OWN `playerView`-REDACTED copy of G — see game/playerView.ts — since a real per-client view
 * is exactly what that filtering is for. That's fine for ai/evaluate.ts's SCORING, which
 * deliberately never reads the opponent's actual hand/deck contents anyway (see ai/enumerate.ts's
 * file doc comment) — but plenty of ordinary, non-hidden-info RULES LOGIC legitimately reads the
 * opponent's hand for bookkeeping unrelated to bot strategy, e.g. moves.ts's
 * hasReactionCardInHand/hasReactionOrActionSpellInHand deciding whether to open a reaction window
 * at all. Called with a REDACTED G, `getCard("hidden")` on that placeholder throws. boardgame.io's
 * `LocalMaster` invokes a `Bot` against its own CANONICAL, unredacted state instead (see
 * Master.onUpdate's `storageAPI.fetch`) — the actually-correct integration point for a bot that's
 * "just another player" in a same-process local match, not a network-exposed client.
 *
 * `play()` always returns SOME action, even when ai/enumerate.ts's own `isBotTurn` considers there
 * to be nothing left to do — see enumerateBotActionsOrFallback's doc comment: boardgame.io's own
 * `Local()` transport can decide it's worth asking this bot to move (via `ctx.activePlayers`) in a
 * moment that's already settled from this side's perspective (most commonly: this side already
 * submitted a PendingDamageAssignment order but the other side hasn't yet). Returning
 * `{action: undefined}` there crashes boardgame.io's own LocalMaster — this used to be exactly
 * that bug, hit in real play.
 */
export function createBotClass(tier: BotTier): new (opts: ConstructorParameters<typeof Bot>[0]) => Bot {
  return class RiftboundBot extends Bot {
    async play({ G, ctx }: { G: GameState; ctx: Ctx }, playerID: PlayerID) {
      const raw = enumerateBotActionsOrFallback(G, ctx, playerID as PlayerId);
      const wrapped = this.enumerate(G, ctx, playerID);
      const index = pickBotActionIndex(tier, G, ctx, playerID as PlayerId, raw);
      // `index` should always be non-null and in bounds here — `raw`/`wrapped` are both derived
      // from the exact same (fallback-guaranteed, never-empty) enumeration. The clamp is defense
      // in depth against a future enumerate.ts bug, not an expected path.
      const chosenIndex = index !== null && index < wrapped.length ? index : Math.max(0, wrapped.length - 1);
      return { action: wrapped[chosenIndex] };
    }
  };
}
