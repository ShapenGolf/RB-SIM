import type { SpecialCaseHandler } from "./types";
import { playTokenHere } from "./token-helpers";

/** [Shield] When I hold, play a ready 3 Might Sprite unit token with [Temporary] here. */
export const trevorSnoozebottom: SpecialCaseHandler = {
  cardId: "trevor-snoozebottom",
  onHold: (ctx) => {
    const token = playTokenHere(ctx.game, "token-sprite-temporary", ctx.instance.controller, ctx.instance);
    token.exhausted = false;
  },
};
