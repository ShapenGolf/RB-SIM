import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/** [Deathknell] — Play three 1 Might Recruit unit tokens into your base. */
export const machineEvangel: SpecialCaseHandler = {
  cardId: "machine-evangel",
  onDestroy: (ctx) => {
    const controller = ctx.instance.controller;
    for (let i = 0; i < 3; i += 1) {
      const token = createInstance(ctx.game, "token-recruit", controller);
      ctx.game.players[controller].base.push(token.instanceId);
    }
  },
};
