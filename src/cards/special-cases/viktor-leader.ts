import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/** When another non-Recruit unit you control dies, play a 1 Might Recruit unit token into your base. */
export const viktorLeader: SpecialCaseHandler = {
  cardId: "viktor-leader",
  onAllyUnitDied: (ctx, diedInstance) => {
    if (diedInstance.cardId === "token-recruit") return;
    const token = createInstance(ctx.game, "token-recruit", ctx.instance.controller);
    ctx.game.players[ctx.instance.controller].base.push(token.instanceId);
  },
};
