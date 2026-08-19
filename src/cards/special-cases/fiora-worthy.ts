import { getCard } from "../db";
import { SpecialCaseEngine } from "./registry";
import { readyInstance } from "./ready-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When a unit you control becomes [Mighty], you may pay Order Rune to ready it. (A unit is
 * Mighty while it has 5+ Might.)
 *
 * See game/mightTransition.ts checkBecameMighty for how "becomes Mighty" is detected.
 */
export const fioraWorthy: SpecialCaseHandler = {
  cardId: "fiora-worthy",
  onAllyBecameMighty: (ctx, mightyInstance) => {
    if (ctx.game.pendingOptionalCost) return;
    SpecialCaseEngine.offerOptionalCost(
      ctx.game,
      ctx.instance.controller,
      "fiora-worthy",
      { energy: 0, runeDomain: "Order" },
      mightyInstance.instanceId,
    );
  },
  onOptionalCostPaid: (game, _playerId, payload) => {
    if (!payload) return;
    readyInstance(game, getCard, payload);
  },
};
