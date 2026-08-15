import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * [Hidden] Friendly units enter ready this turn. Play a Gold gear token exhausted.
 *
 * [Hidden]'s face-down/react-later timing isn't modeled — resolves immediately.
 */
export const bushwhack: SpecialCaseHandler = {
  cardId: "bushwhack",
  onPlay: (ctx) => {
    ctx.game.players[ctx.instance.controller].unitsEnterReadyThisTurn = true;
    playTokenToBase(ctx.game, "token-gold-gear", ctx.instance.controller);
  },
};
