import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** When you play me, play four Gold gear tokens exhausted. */
export const troveGolem: SpecialCaseHandler = {
  cardId: "trove-golem",
  onPlay: (ctx) => {
    for (let i = 0; i < 4; i += 1) {
      const token = playTokenToBase(ctx.game, "token-gold-gear", ctx.instance.controller);
      token.exhausted = true;
    }
  },
};
