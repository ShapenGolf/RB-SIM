import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * You may pay Calm Rune as an additional cost to play me. When you play me, if you paid the
 * additional cost, [Stun] an enemy unit. When I hold, the next time you play a unit this turn,
 * ready it and [Buff] it.
 *
 * Simplification: the Domain-Rune additional cost is never charged (established precedent, see
 * crescent-guardian.ts). No player choice of which enemy unit to Stun — picks the first one
 * found.
 */
export const namiHeadstrong: SpecialCaseHandler = {
  cardId: "nami-headstrong",
  additionalPlayCostEnergy: () => 0,
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (target) target.statuses.stunned = true;
  },
  onHold: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    player.nextUnitEntersReady = true;
    player.nextUnitBuffed = true;
  },
};
