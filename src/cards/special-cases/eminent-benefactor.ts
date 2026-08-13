import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/** When I hold, play two Gold gear tokens exhausted. */
export const eminentBenefactor: SpecialCaseHandler = {
  cardId: "eminent-benefactor",
  onHold: (ctx) => {
    const controller = ctx.instance.controller;
    for (let i = 0; i < 2; i += 1) {
      const token = createInstance(ctx.game, "token-gold-gear", controller);
      token.exhausted = true;
      ctx.game.players[controller].base.push(token.instanceId);
    }
  },
};
