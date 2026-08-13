import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/** [Deathknell] — Play two 3 Might Mech unit tokens to your base. */
export const ferrousForerunner: SpecialCaseHandler = {
  cardId: "ferrous-forerunner",
  onDestroy: (ctx) => {
    const controller = ctx.instance.controller;
    for (let i = 0; i < 2; i += 1) {
      const token = createInstance(ctx.game, "token-mech-3", controller);
      ctx.game.players[controller].base.push(token.instanceId);
    }
  },
};
