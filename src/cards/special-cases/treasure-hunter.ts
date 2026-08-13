import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/** When I move, play a Gold gear token exhausted. */
export const treasureHunter: SpecialCaseHandler = {
  cardId: "treasure-hunter",
  onMove: (ctx) => {
    const controller = ctx.instance.controller;
    const token = createInstance(ctx.game, "token-gold-gear", controller);
    token.exhausted = true;
    ctx.game.players[controller].base.push(token.instanceId);
  },
};
