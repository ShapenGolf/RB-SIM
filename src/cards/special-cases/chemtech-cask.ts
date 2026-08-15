import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/**
 * When you play a spell on an opponent's turn, you may exhaust me to play a Gold gear token
 * exhausted. Always taken when able (a free Gold gear token for exhausting a gear that isn't
 * otherwise doing anything — no separate Energy/Rune cost to weigh, see docs/data-sourcing.md).
 */
export const chemtechCask: SpecialCaseHandler = {
  cardId: "chemtech-cask",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type !== "spell") return;
    if (ctx.instance.exhausted) return;
    if (ctx.game.activePlayer === ctx.instance.controller) return;
    ctx.instance.exhausted = true;
    const token = createInstance(ctx.game, "token-gold-gear", ctx.instance.controller);
    token.exhausted = true;
    ctx.game.players[ctx.instance.controller].base.push(token.instanceId);
  },
};
