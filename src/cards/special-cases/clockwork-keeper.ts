import type { SpecialCaseHandler } from "./types";

/**
 * As you play me, you may pay Calm Rune as an additional cost. If you do, draw 1.
 *
 * Simplification: the Domain-Rune additional cost is never charged (established precedent, see
 * crescent-guardian.ts).
 */
export const clockworkKeeper: SpecialCaseHandler = {
  cardId: "clockwork-keeper",
  additionalPlayCostEnergy: () => 0,
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
