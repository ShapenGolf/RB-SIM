import type { SpecialCaseHandler } from "./types";
import { playTokenHere } from "./token-helpers";

/** When you play me, play a 2 Might Sand Soldier unit token here. */
export const royalGuard: SpecialCaseHandler = {
  cardId: "royal-guard",
  onPlay: (ctx) => {
    playTokenHere(ctx.game, "token-sand-soldier-2", ctx.instance.controller, ctx.instance);
  },
};
