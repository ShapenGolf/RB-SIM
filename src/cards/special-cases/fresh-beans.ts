import type { SpecialCaseHandler } from "./types";

/**
 * When you play a unit during a showdown, you may exhaust this to draw 1.
 *
 * "During a showdown" isn't distinguished from a normal Main Phase play (a documented
 * approximation — see docs/data-sourcing.md). Simplification: the "may" always resolves yes (no
 * real downside — this gear has no other ability that needs it ready).
 */
export const freshBeans: SpecialCaseHandler = {
  cardId: "fresh-beans",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type !== "unit" && playedCard.type !== "champion") return;
    if (ctx.instance.exhausted) return;
    ctx.instance.exhausted = true;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
