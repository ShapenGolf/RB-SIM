import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/**
 * Play four 1 Might Recruit unit tokens. (They can be played to your base or to battlefields
 * you control.)
 *
 * Simplification: no battlefield-placement UI for tokens (see docs/data-sourcing.md) — all four
 * go to base.
 */
export const recruitTheVanguard: SpecialCaseHandler = {
  cardId: "recruit-the-vanguard",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    for (let i = 0; i < 4; i += 1) {
      const token = createInstance(ctx.game, "token-recruit", controller);
      ctx.game.players[controller].base.push(token.instanceId);
    }
  },
};
