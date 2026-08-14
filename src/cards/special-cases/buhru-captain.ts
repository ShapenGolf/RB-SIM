import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, you may draw 1 or buff me.
 *
 * Simplification: no choice-UI for an either/or decision (see docs/data-sourcing.md) — always
 * draws.
 */
export const buhruCaptain: SpecialCaseHandler = {
  cardId: "buhru-captain",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
