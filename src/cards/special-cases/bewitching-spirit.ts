import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { discardCardToTrash } from "../../game/discardEngine";

/**
 * When you play me, choose a player. They discard 1.
 *
 * Simplification: always targets the opponent (see docs/data-sourcing.md) — no UI to choose
 * yourself, which would rarely be the intended play anyway.
 */
export const bewitchingSpirit: SpecialCaseHandler = {
  cardId: "bewitching-spirit",
  onPlay: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const opponent = ctx.game.players[opponentId];
    const toDiscard = opponent.hand[0];
    if (!toDiscard) return;
    opponent.hand.shift();
    discardCardToTrash(ctx.game, getCard, opponentId, toDiscard);
  },
};
