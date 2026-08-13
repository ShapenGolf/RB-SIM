import type { SpecialCaseHandler } from "./types";

/**
 * When you kill a stunned enemy unit, you may exhaust this to draw 1.
 *
 * Simplification: always takes the draw when available (exhausting itself has no real
 * downside for this card — it has no other activated ability competing for its ready state),
 * so the "may" is auto-resolved rather than routed through the pendingOptionalCost prompt.
 */
export const solariShrine: SpecialCaseHandler = {
  cardId: "solari-shrine",
  onAllyKillUnit: (ctx, killed) => {
    if (!killed.statuses.stunned || ctx.instance.exhausted) return;
    ctx.instance.exhausted = true;
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
};
