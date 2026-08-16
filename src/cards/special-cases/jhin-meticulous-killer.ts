import type { SpecialCaseHandler } from "./types";

/**
 * [Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.)
 * If you've spent 4 Energy or more to play a spell this turn, you may play me for Mind Rune.
 *
 * [Vision] is implemented via the generic pendingPredict flag (apprentice-mage.ts precedent).
 * The alternate-cost clause ("play me for Mind Rune" instead of normal cost, gated on
 * maxEnergySpentOnSpellThisTurn) isn't modeled — this engine's cost formula (game/moves.ts
 * playCard) has no "substitute the entire cost with X" mechanism, only reductions/increases
 * layered on the printed cost (deferred, see docs/data-sourcing.md).
 */
export const jhinMeticulousKiller: SpecialCaseHandler = {
  cardId: "jhin-meticulous-killer",
  onPlay: (ctx) => {
    ctx.game.players[ctx.instance.controller].pendingPredict = true;
  },
};
