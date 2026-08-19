import type { KeywordHandler } from "../types";

/**
 * Vision: "When this is played, predict" — look at the top card of your Main
 * Deck and choose to keep it on top or move it to the bottom. The generic
 * handler flags the decision as pending; the `resolvePredict` move in the
 * game core carries it out.
 */
export const visionHandler: KeywordHandler = {
  name: "vision",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player) player.pendingPredict = 1;
  },
};
