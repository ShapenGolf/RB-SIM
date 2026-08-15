import type { SpecialCaseHandler } from "./types";

/**
 * [Action] [Repeat] Chaos Rune (You may pay the additional cost to repeat this spell's effect.)
 * Look at the top 2 cards of your Main Deck. Draw one and recycle the other.
 *
 * [Repeat] isn't wired up (~24 occurrences, deliberately not built — see docs/data-sourcing.md)
 * — only the base single resolution is implemented. Simplification: no player choice of which of
 * the 2 cards to draw (see docs/data-sourcing.md) — draws the top one, recycles the second to the
 * bottom of the deck.
 */
export const calledShot: SpecialCaseHandler = {
  cardId: "called-shot",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const top = player.mainDeck.shift();
    if (top) player.hand.push(top);
    const second = player.mainDeck.shift();
    if (second) player.mainDeck.push(second);
  },
};
