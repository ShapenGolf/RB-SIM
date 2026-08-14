import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** 1 Energy, Exhaust: Play a 1 Might Recruit unit token. */
export const heraldOfTheArcane: SpecialCaseHandler = {
  cardId: "herald-of-the-arcane",
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  onActivate: (ctx) => {
    playTokenToBase(ctx.game, "token-recruit", ctx.instance.controller);
  },
};
