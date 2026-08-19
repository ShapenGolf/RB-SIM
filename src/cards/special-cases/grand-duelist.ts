import { SpecialCaseEngine } from "./registry";
import type { SpecialCaseHandler } from "./types";

/**
 * When one of your units becomes [Mighty], you may exhaust me to channel 1 rune exhausted. (A
 * unit is Mighty while it has 5+ Might.)
 *
 * See game/mightTransition.ts checkBecameMighty for how "becomes Mighty" is detected, and
 * PendingOptionalCost.cost.exhaustSourceInstanceId (game/state.ts) for the "exhaust me" reactive
 * cost — this ability isn't a normal player-initiated activateAbility, so the usual
 * activatedAbilityCost/exhaustSelf shape doesn't apply.
 */
export const grandDuelist: SpecialCaseHandler = {
  cardId: "grand-duelist",
  onAllyBecameMighty: (ctx) => {
    if (ctx.game.pendingOptionalCost || ctx.instance.exhausted) return;
    SpecialCaseEngine.offerOptionalCost(ctx.game, ctx.instance.controller, "grand-duelist", {
      energy: 0,
      exhaustSourceInstanceId: ctx.instance.instanceId,
    });
  },
  onOptionalCostPaid: (game, playerId) => {
    const player = game.players[playerId];
    const rune = player.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      player.runePool.push(rune);
    }
  },
};
