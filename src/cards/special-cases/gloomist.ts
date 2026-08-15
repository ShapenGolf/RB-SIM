import type { SpecialCaseHandler } from "./types";

/**
 * When you or an ally hold, you may exhaust me to draw 1.
 *
 * Simplification: always exhausts to draw if not already exhausted (no real downside — see
 * docs/data-sourcing.md).
 */
export const gloomist: SpecialCaseHandler = {
  cardId: "gloomist",
  onHold: (ctx) => {
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (!legend || legend.exhausted) return;
    legend.exhausted = true;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
