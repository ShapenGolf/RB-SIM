import { getCard } from "../db";
import { SpecialCaseEngine } from "./registry";
import type { SpecialCaseHandler } from "./types";

/**
 * When a showdown begins here, you may pay 1 Energy. If you do, [Predict], then reveal the top
 * card of your Main Deck. If it's a spell, draw it.
 *
 * Simplification: the Predict step (look at the top card, may recycle it) resolving BEFORE the
 * reveal would change which card gets revealed — since that ordering interaction has no existing
 * infra, this reveals the current top card directly and skips modeling Predict's effect on it
 * (a documented gap — see docs/data-sourcing.md).
 */
export const dianaLunari: SpecialCaseHandler = {
  cardId: "diana-lunari",
  onShowdownBegin: (ctx) => {
    if (ctx.game.pendingOptionalCost) return;
    SpecialCaseEngine.offerOptionalCost(ctx.game, ctx.instance.controller, "diana-lunari", { energy: 1 });
  },
  onOptionalCostPaid: (game, playerId) => {
    const player = game.players[playerId];
    const top = player.mainDeck[0];
    if (top && getCard(top).type === "spell") {
      player.mainDeck.shift();
      player.hand.push(top);
    }
  },
};
