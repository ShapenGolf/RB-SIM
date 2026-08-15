import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Choose one — Choose up to 3 cards from opponents' trashes, their owners recycle
 * them. / Draw 1.
 *
 * Reaction timing isn't modeled — resolves immediately. Simplification: always picks "Draw 1"
 * (see docs/data-sourcing.md) — recycling an opponent's trash back into their deck is rarely
 * beneficial to the caster, so the safe universal mode is used.
 */
export const disposalOrder: SpecialCaseHandler = {
  cardId: "disposal-order",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
