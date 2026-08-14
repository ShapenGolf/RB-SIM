import type { SpecialCaseHandler } from "./types";
import { discardCardToTrash } from "../../game/discardEngine";
import { getCard } from "../db";

/**
 * When you play me, discard 1, then draw 2. / Optional additional costs you pay cost 1 Energy
 * or Rune less.
 *
 * Only the discard-then-draw half is implemented; the cost-reduction-on-additional-costs clause
 * would need to reach into every additional-cost payment path (Accelerate, equip, the optional
 * play-cost system) and isn't modeled (see docs/data-sourcing.md).
 */
export const ezrealProdigy: SpecialCaseHandler = {
  cardId: "ezreal-prodigy",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const toDiscard = player.hand[0];
    if (toDiscard) {
      player.hand.shift();
      discardCardToTrash(ctx.game, getCard, ctx.instance.controller, toDiscard);
    }
    for (let i = 0; i < 2; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
