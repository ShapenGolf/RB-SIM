import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/** [Deathknell] — Play a Gold gear token exhausted. */
export const honestBroker: SpecialCaseHandler = {
  cardId: "honest-broker",
  onDestroy: (ctx) => {
    const controller = ctx.instance.controller;
    const token = createInstance(ctx.game, "token-gold-gear", controller);
    token.exhausted = true;
    ctx.game.players[controller].base.push(token.instanceId);
  },
};
