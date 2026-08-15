import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * When I conquer, play a 0 Might Shadow Clone unit token to your base. (It has "When I attack, ...")
 * Simplification: the token's own printed ability isn't modeled — it's created as a plain,
 * ability-less copy of the shared token-shadow-clone card (see docs/data-sourcing.md).
 */
export const zedWithoutASound: SpecialCaseHandler = {
  cardId: "zed-without-a-sound",
  onConquer: (ctx) => {
    playTokenToBase(ctx.game, "token-shadow-clone", ctx.instance.controller);
  },
};
