import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * [Hidden] [Action] Play a ready 3 Might Sprite unit token with [Temporary].
 *
 * [Hidden]'s face-down timing isn't modeled — resolves immediately. Temporary and the 3 Might
 * value are already baked into token-sprite-temporary's own card data.
 */
export const spriteCall: SpecialCaseHandler = {
  cardId: "sprite-call",
  onPlay: (ctx) => {
    const token = playTokenToBase(ctx.game, "token-sprite-temporary", ctx.instance.controller);
    token.exhausted = false;
  },
};
