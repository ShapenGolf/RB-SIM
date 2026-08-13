import type { SpecialCaseHandler } from "./types";

/**
 * [Deflect] When I conquer, draw 1 or channel 1 rune exhausted.
 *
 * Simplification: always draws — offering a genuine choice between the two options would need
 * a choice-selection UI this engine doesn't have yet (see docs/data-sourcing.md).
 */
export const qiyana: SpecialCaseHandler = {
  cardId: "qiyana",
  onConquer: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
};
