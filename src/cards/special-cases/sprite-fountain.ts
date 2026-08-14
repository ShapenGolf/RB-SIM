import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** [Temporary] When you play this, play a ready 3 Might Sprite unit token with [Temporary] to your base. [Deathknell] Repeat this gear's play effect. */
export const spriteFountain: SpecialCaseHandler = {
  cardId: "sprite-fountain",
  onPlay: (ctx) => {
    const token = playTokenToBase(ctx.game, "token-sprite-temporary", ctx.instance.controller);
    token.exhausted = false;
  },
  onDestroy: (ctx) => {
    const token = playTokenToBase(ctx.game, "token-sprite-temporary", ctx.instance.controller);
    token.exhausted = false;
  },
};
