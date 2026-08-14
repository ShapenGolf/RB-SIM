import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * Choose an opponent. They reveal their hand and you choose a Mind (Mind Rune) card from it. They recycle that card.
 * Simplification: only two players exist, so "choose an opponent" has no real choice. No player
 * choice of WHICH matching card either (see docs/data-sourcing.md discard-choice simplification)
 * — picks the first Mind card found in their hand.
 */
export const decreeOfStrength: SpecialCaseHandler = {
  cardId: "decree-of-strength",
  onPlay: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const opponent = ctx.game.players[opponentId];
    const index = opponent.hand.findIndex((cardId) => getCard(cardId).domains.includes("Mind"));
    if (index === -1) return;
    const [recycled] = opponent.hand.splice(index, 1);
    opponent.mainDeck.push(recycled);
  },
};
