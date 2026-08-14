import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

const THRESHOLD = 3;

/** When you conquer here, if you assigned 3 or more excess damage, play a 1 Might Bird unit token with [Deflect]. */
export const trappingGrounds: SpecialCaseHandler = {
  cardId: "trapping-grounds",
  onConquerHere: (ctx, _conqueringUnitIds, excessDamage) => {
    if (excessDamage < THRESHOLD) return;
    playTokenToBase(ctx.game, "token-bird-deflect", ctx.instance.controller);
  },
};
