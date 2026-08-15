import { getCard } from "../db";
import { returnInstanceToHand } from "./bounce-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * Starting with the next player, each player may return a unit to its owner's hand.
 *
 * Simplification: both players' "may" always resolves yes when a unit is available (no real
 * downside — see docs/data-sourcing.md). No player choice of which unit — each player returns
 * their own weakest unit.
 */
export const whirlwind: SpecialCaseHandler = {
  cardId: "whirlwind",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    for (const playerId of [enemyId, ctx.instance.controller] as const) {
      const unit = Object.values(ctx.game.instances).find((i) => {
        if (i.controller !== playerId) return false;
        const t = getCard(i.cardId).type;
        return t === "unit" || t === "champion";
      });
      if (unit) returnInstanceToHand(ctx.game, unit.instanceId);
    }
  },
};
