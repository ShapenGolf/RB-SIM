import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/**
 * The first time a friendly unit dies during your Beginning Phase each turn, each opponent must
 * kill one of their units.
 *
 * Simplification: no player choice of which of the opponent's units dies (see
 * docs/data-sourcing.md) — kills the first unit/champion found. `statuses.triggeredThisTurn`
 * follows the "ThisTurn" suffix convention (see state.ts CardInstance.statuses), auto-cleared by
 * turnFlow.ts's runTurnStart.
 */
export const shardOfUndoing: SpecialCaseHandler = {
  cardId: "shard-of-undoing",
  onAllyUnitDied: (ctx) => {
    if (ctx.game.turnPhase !== "beginning") return;
    if (ctx.instance.statuses.triggeredThisTurn) return;
    ctx.instance.statuses.triggeredThisTurn = true;

    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const victim = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== opponentId) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (victim) destroyInstance(ctx.game, getCard, victim.instanceId);
  },
};
