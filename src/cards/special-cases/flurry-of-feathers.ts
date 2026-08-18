import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

const TOKEN_COUNT = 4;

/**
 * [Reaction] Choose one — Counter a spell. / Play four 1 Might Bird unit tokens with [Deflect].
 *
 * The modal choice isn't a separate UI prompt — it's implicit in HOW the card is played: playing
 * it as a reaction into an open PendingSpellReaction window always attempts to counter (see
 * canCounterPending below and moves.ts's playCard, which settles the counter unconditionally once
 * a card with counter intent is legally played as a reaction); playing it normally always makes
 * birds, exactly like before this card had a counter mode at all.
 */
export const flurryOfFeathers: SpecialCaseHandler = {
  cardId: "flurry-of-feathers",
  canCounterPending: () => true,
  onPlay: (ctx) => {
    if (ctx.game.pendingSpellReaction) return; // countering instead — see moves.ts's playCard
    for (let i = 0; i < TOKEN_COUNT; i += 1) {
      playTokenToBase(ctx.game, "token-bird-deflect", ctx.instance.controller);
    }
  },
};
