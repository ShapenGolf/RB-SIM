import { playTokenToBase } from "./token-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When you or an ally hold, you may exhaust me to play a Gold gear token exhausted.
 * While your score is within 3 points of the Victory Score, your Gold [Add] an additional 1
 * Energy.
 *
 * Known gap: the "[Add] an additional 1 Energy" clause isn't modeled — this engine has no
 * generic "Add" resource-generation mechanic yet (see docs/data-sourcing.md). Simplification:
 * always exhausts to play the token if not already exhausted (no real downside).
 */
export const chemBaroness: SpecialCaseHandler = {
  cardId: "chem-baroness",
  onHold: (ctx) => {
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (!legend || legend.exhausted) return;
    legend.exhausted = true;
    const token = playTokenToBase(ctx.game, "token-gold-gear", ctx.instance.controller);
    token.exhausted = true;
  },
};
