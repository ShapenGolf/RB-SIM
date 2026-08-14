import type { SpecialCaseHandler } from "./types";
import { playTokenHere } from "./token-helpers";

/** Exhaust: Play two 1 Might Bird unit tokens with [Deflect]. Use this ability only while I'm at a battlefield. */
export const ultrasoftPoro: SpecialCaseHandler = {
  cardId: "ultrasoft-poro",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    playTokenHere(ctx.game, "token-bird-deflect", ctx.instance.controller, ctx.instance);
    playTokenHere(ctx.game, "token-bird-deflect", ctx.instance.controller, ctx.instance);
  },
};
