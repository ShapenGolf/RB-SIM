import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * Play a 3 Might Mech unit token.
 * Flow (play from trash for its Flow cost, then banish) isn't wired up yet — see docs/data-sourcing.md;
 * this covers the card's baseline effect when played normally from hand.
 */
export const iterativeDesign: SpecialCaseHandler = {
  cardId: "iterative-design",
  onPlay: (ctx) => {
    playTokenToBase(ctx.game, "token-mech-3", ctx.instance.controller);
  },
};
