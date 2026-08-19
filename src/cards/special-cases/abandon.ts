import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell. Return it to its owner's hand instead of putting it in their trash.
 * [Predict].
 *
 * onPlay fires either way this resolves (played normally, or as a counter into a reaction window
 * — see moves.ts's resolvePlayedCard, called from both the normal playCard path and the
 * reactingToSpell branch), so a plain onPlay hook covers Predict regardless of the counter outcome.
 */
export const abandon: SpecialCaseHandler = {
  cardId: "abandon",
  canCounterPending: () => true,
  counterDestination: "hand",
  onPlay: (ctx) => {
    ctx.game.players[ctx.instance.controller].pendingPredict = 1;
  },
};
