import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { discardCardToTrash } from "../../game/discardEngine";

/**
 * When you play me, choose an opponent. They reveal their hand. Choose a card from it, and
 * they discard that card.
 *
 * Simplification: no player choice of which card (see docs/data-sourcing.md) — discards the
 * first card in the opponent's hand.
 */
export const mindsplitter: SpecialCaseHandler = {
  cardId: "mindsplitter",
  onPlay: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const opponent = ctx.game.players[opponentId];
    const discarded = opponent.hand.shift();
    if (discarded) discardCardToTrash(ctx.game, getCard, opponentId, discarded);
  },
};
