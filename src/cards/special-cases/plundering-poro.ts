import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/** When I conquer, play a Gold gear token exhausted. */
export const plunderingPoro: SpecialCaseHandler = {
  cardId: "plundering-poro",
  onConquer: (ctx) => {
    const controller = ctx.instance.controller;
    const token = createInstance(ctx.game, "token-gold-gear", controller);
    token.exhausted = true;
    ctx.game.players[controller].base.push(token.instanceId);
  },
};
