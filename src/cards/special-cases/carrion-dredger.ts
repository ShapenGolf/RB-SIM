import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** [Deathknell] — Play a 1 Might Bird unit token with [Deflect] to your base. */
export const carrionDredger: SpecialCaseHandler = {
  cardId: "carrion-dredger",
  onDestroy: (ctx) => {
    playTokenToBase(ctx.game, "token-bird-deflect", ctx.instance.controller);
  },
};
