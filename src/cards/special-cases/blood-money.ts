import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import { createInstance } from "../../game/setup";

/**
 * [Action] Kill a unit at a battlefield with 2 Might or less. If it was an enemy unit, play a Gold
 * gear token exhausted. If it was a friendly unit, play two Gold gear tokens exhausted.
 */
export const bloodMoney: SpecialCaseHandler = {
  cardId: "blood-money",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield") return;
    if (computeMight(ctx.game, getCard, target, "none") > 2) return;
    const wasFriendly = target.controller === ctx.instance.controller;
    destroyInstance(ctx.game, getCard, targetInstanceId);
    const count = wasFriendly ? 2 : 1;
    for (let i = 0; i < count; i += 1) {
      const token = createInstance(ctx.game, "token-gold-gear", ctx.instance.controller);
      token.exhausted = true;
      ctx.game.players[ctx.instance.controller].base.push(token.instanceId);
    }
  },
};
