import type { SpecialCaseHandler } from "./types";
import { playTokenHere } from "./token-helpers";

/** When you play me, play a 1 Might Bird unit token with [Deflect] here. */
export const friskyHunter: SpecialCaseHandler = {
  cardId: "frisky-hunter",
  onPlay: (ctx) => {
    playTokenHere(ctx.game, "token-bird-deflect", ctx.instance.controller, ctx.instance);
  },
};
