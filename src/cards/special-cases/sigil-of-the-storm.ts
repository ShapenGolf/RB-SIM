import type { SpecialCaseHandler } from "./types";

/**
 * When you conquer here, recycle one of your runes.
 *
 * Simplification: no player choice of which rune (see docs/data-sourcing.md) — recycles the
 * first rune found in the rune pool.
 */
export const sigilOfTheStorm: SpecialCaseHandler = {
  cardId: "sigil-of-the-storm",
  onConquerHere: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const rune = player.runePool.shift();
    if (!rune) return;
    player.runeDeck.push({ ...rune, exhausted: false });
  },
};
