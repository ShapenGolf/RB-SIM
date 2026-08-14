import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** [Deflect] When you play me, choose an opponent. They play a 1 Might Bird unit token with [Deflect]. */
export const walkingRoost: SpecialCaseHandler = {
  cardId: "walking-roost",
  onPlay: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    playTokenToBase(ctx.game, "token-bird-deflect", opponentId);
  },
};
