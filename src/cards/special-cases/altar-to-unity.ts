import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/** When you hold here, play a 1 Might Recruit unit token in your base. */
export const altarToUnity: SpecialCaseHandler = {
  cardId: "altar-to-unity",
  onBeginningWhileHeld: (ctx) => {
    const controller = ctx.instance.controller;
    const token = createInstance(ctx.game, "token-recruit", controller);
    ctx.game.players[controller].base.push(token.instanceId);
  },
};
