import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** [Empowered][Deathknell] Play two 1 Might Recruit unit tokens to your base. */
export const noxianEmissary: SpecialCaseHandler = {
  cardId: "noxian-emissary",
  onDestroy: (ctx) => {
    if (!ctx.instance.statuses.empowered) return;
    playTokenToBase(ctx.game, "token-recruit", ctx.instance.controller);
    playTokenToBase(ctx.game, "token-recruit", ctx.instance.controller);
  },
};
