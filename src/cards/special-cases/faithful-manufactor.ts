import type { SpecialCaseHandler } from "./types";
import { playTokenHere } from "./token-helpers";

/** When you play me, play a 1 Might Recruit unit token here. */
export const faithfulManufactor: SpecialCaseHandler = {
  cardId: "faithful-manufactor",
  onPlay: (ctx) => {
    playTokenHere(ctx.game, "token-recruit", ctx.instance.controller, ctx.instance);
  },
};
