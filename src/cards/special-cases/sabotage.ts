import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * Choose an opponent. They reveal their hand. Choose a non-unit card from it, and recycle
 * that card.
 *
 * Simplification: no player choice of which non-unit card (see docs/data-sourcing.md) — picks
 * the first one found in the opponent's hand.
 */
export const sabotage: SpecialCaseHandler = {
  cardId: "sabotage",
  onPlay: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const opponent = ctx.game.players[opponentId];
    const idx = opponent.hand.findIndex((cardId) => getCard(cardId).type !== "unit");
    if (idx === -1) return;
    const [cardId] = opponent.hand.splice(idx, 1);
    opponent.mainDeck.push(cardId);
  },
};
