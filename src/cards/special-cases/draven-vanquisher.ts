import { playTokenToBase } from "./token-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When I win a combat, play a Gold gear token exhausted.
 * When I attack or defend, you may pay Fury Rune. If you do, give me +2 Might this turn.
 *
 * Known gap: the "pay Fury Rune when I attack or defend" optional buff isn't modeled (no live
 * Domain-Rune-payment flow at that trigger point — see docs/data-sourcing.md). Only the
 * onWinCombat token play is implemented.
 */
export const dravenVanquisher: SpecialCaseHandler = {
  cardId: "draven-vanquisher",
  onWinCombat: (ctx) => {
    const token = playTokenToBase(ctx.game, "token-gold-gear", ctx.instance.controller);
    token.exhausted = true;
  },
};
