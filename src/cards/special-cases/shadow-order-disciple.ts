import type { SpecialCaseHandler } from "./types";

/**
 * When I move, you may [Burn 1] to give me +1 Might this turn. (To Burn 1, put the top card of
 * your Main Deck into your trash.)
 * Always taken when able — a cheap, strictly-worth-it trade in the vast majority of game states,
 * no attached decision worth surfacing (see docs/data-sourcing.md).
 */
export const shadowOrderDisciple: SpecialCaseHandler = {
  cardId: "shadow-order-disciple",
  onMove: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const burned = player.mainDeck.shift();
    if (!burned) return;
    player.trash.push(burned);
    ctx.instance.tempMightBonus += 1;
  },
};
