import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * Exhaust: Play three 1 Might Recruit unit tokens. (You may play them to different locations.)
 *
 * Simplification: no battlefield-placement UI for tokens (see docs/data-sourcing.md) — all
 * three go to base.
 */
export const vanguardArmory: SpecialCaseHandler = {
  cardId: "vanguard-armory",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    for (let i = 0; i < 3; i += 1) {
      playTokenToBase(ctx.game, "token-recruit", ctx.instance.controller);
    }
  },
};
