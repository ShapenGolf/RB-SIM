import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** Play two ready 3 Might Sprite unit tokens with [Temporary]. */
export const spriteBurst: SpecialCaseHandler = {
  cardId: "sprite-burst",
  onPlay: (ctx) => {
    for (let i = 0; i < 2; i += 1) {
      const token = playTokenToBase(ctx.game, "token-sprite-temporary", ctx.instance.controller);
      token.exhausted = false;
    }
  },
};
