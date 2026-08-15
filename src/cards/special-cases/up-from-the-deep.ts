import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** Play two 1 Might Tentacle unit tokens from Bilgewater. */
export const upFromTheDeep: SpecialCaseHandler = {
  cardId: "up-from-the-deep",
  onPlay: (ctx) => {
    playTokenToBase(ctx.game, "token-tentacle", ctx.instance.controller);
    playTokenToBase(ctx.game, "token-tentacle", ctx.instance.controller);
  },
};
