import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * Play a 2 Might Sand Soldier unit token.
 * Repeat (pay 2 Energy to play this again from trash) isn't wired up yet — see
 * docs/data-sourcing.md; this covers the card's baseline single effect.
 */
export const desertsCall: SpecialCaseHandler = {
  cardId: "deserts-call",
  onPlay: (ctx) => {
    playTokenToBase(ctx.game, "token-sand-soldier-2", ctx.instance.controller);
  },
};
