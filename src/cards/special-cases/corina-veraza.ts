import type { SpecialCaseHandler } from "./types";
import { playTokenHere } from "./token-helpers";

const TOKEN_COUNT = 3;

/** [Accelerate] When I move to a battlefield, play three 1 Might Recruit unit tokens here. */
export const corinaVeraza: SpecialCaseHandler = {
  cardId: "corina-veraza",
  onMove: (ctx) => {
    for (let i = 0; i < TOKEN_COUNT; i += 1) {
      playTokenHere(ctx.game, "token-recruit", ctx.instance.controller, ctx.instance);
    }
  },
};
