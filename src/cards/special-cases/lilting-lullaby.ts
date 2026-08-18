import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell. Its controller can't play spells this turn.
 */
export const liltingLullaby: SpecialCaseHandler = {
  cardId: "lilting-lullaby",
  canCounterPending: () => true,
  onPlay: (ctx) => {
    const pending = ctx.game.pendingSpellReaction;
    if (pending) ctx.game.players[pending.casterId].cantPlaySpellsThisTurn = true;
  },
};
