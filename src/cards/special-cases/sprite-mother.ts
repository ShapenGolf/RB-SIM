import type { SpecialCaseHandler } from "./types";
import { playTokenHere } from "./token-helpers";

/** When you play me, play a ready 3 Might Sprite unit token with Temporary here. */
export const spriteMother: SpecialCaseHandler = {
  cardId: "sprite-mother",
  onPlay: (ctx) => {
    const token = playTokenHere(ctx.game, "token-sprite-temporary", ctx.instance.controller, ctx.instance);
    token.exhausted = false;
  },
};
