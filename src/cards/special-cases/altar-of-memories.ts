import type { SpecialCaseHandler } from "./types";

/**
 * When a friendly unit dies, you may exhaust me to draw 1, then put a card from your hand on
 * the top or bottom of your Main Deck.
 *
 * Simplification: always exhausts (no real downside) if not already exhausted; no choice of
 * top vs. bottom (bottom, matching the recycle-to-deck convention elsewhere) or which card to
 * put back (front of hand) — see docs/data-sourcing.md.
 */
export const altarOfMemories: SpecialCaseHandler = {
  cardId: "altar-of-memories",
  onAllyUnitDied: (ctx) => {
    if (ctx.instance.exhausted) return;
    const player = ctx.game.players[ctx.instance.controller];
    ctx.instance.exhausted = true;
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
    const returned = player.hand.shift();
    if (returned) player.mainDeck.push(returned);
  },
};
