import type { SpecialCaseHandler } from "./types";
import { playTokenHere } from "./token-helpers";

/** When I move to a battlefield, play a 1 Might Recruit unit token here. */
export const noxianDrummer: SpecialCaseHandler = {
  cardId: "noxian-drummer",
  onAttack: (ctx) => {
    playTokenHere(ctx.game, "token-recruit", ctx.instance.controller, ctx.instance);
  },
};
