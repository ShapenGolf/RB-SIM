import type { SpecialCaseContext, SpecialCaseHandler } from "./types";
import type { PlayerId } from "../../game/state";
import { createInstance } from "../../game/setup";

function playGoldToken(ctx: SpecialCaseContext, controller: PlayerId): void {
  const token = createInstance(ctx.game, "token-gold-gear", controller);
  token.exhausted = true;
  ctx.game.players[controller].base.push(token.instanceId);
}

/**
 * When you play me, you and each opponent may play a Gold gear token exhausted. For each
 * opponent who did, you play a Gold gear token exhausted.
 *
 * Simplification: the "may" auto-resolves to yes for both sides (a Gold gear token is pure
 * upside with no real downside to taking it — see docs/data-sourcing.md).
 */
export const cardSharp: SpecialCaseHandler = {
  cardId: "card-sharp",
  onPlay: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    playGoldToken(ctx, ctx.instance.controller);
    playGoldToken(ctx, opponentId);
    playGoldToken(ctx, ctx.instance.controller);
  },
};
