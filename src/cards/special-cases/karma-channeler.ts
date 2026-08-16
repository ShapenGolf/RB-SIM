import type { SpecialCaseHandler } from "./types";

/**
 * [Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.)
 * When you recycle one or more cards, buff a friendly unit. (If it doesn't have a buff, it gets
 * a +1 Might buff. Runes aren't cards.)
 *
 * [Vision] is implemented via the generic pendingPredict flag (apprentice-mage.ts precedent).
 * "When you recycle one or more cards" isn't modeled — recycling happens at ~25 scattered
 * mainDeck.push call sites across this engine with no single chokepoint to broadcast from
 * (deferred, see docs/data-sourcing.md).
 */
export const karmaChanneler: SpecialCaseHandler = {
  cardId: "karma-channeler",
  onPlay: (ctx) => {
    ctx.game.players[ctx.instance.controller].pendingPredict = true;
  },
};
