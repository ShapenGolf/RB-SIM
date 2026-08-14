import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/**
 * When you conquer here, you may pay 1 Energy to play a Gold gear token exhausted.
 *
 * Simplification: the 1-Energy cost isn't charged (see docs/data-sourcing.md).
 */
export const treasureHoard: SpecialCaseHandler = {
  cardId: "treasure-hoard",
  onConquerHere: (ctx) => {
    const controller = ctx.instance.controller;
    const token = createInstance(ctx.game, "token-gold-gear", controller);
    token.exhausted = true;
    ctx.game.players[controller].base.push(token.instanceId);
  },
};
