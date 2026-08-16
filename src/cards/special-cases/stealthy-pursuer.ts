import { getCard } from "../db";
import { moveInstanceToBase, moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When a friendly unit moves from my location, I may be moved with it.
 *
 * "May" is auto-resolved as always-yes (established precedent). Uses the new
 * onAllyUnitMovedFromMyLocation sibling broadcast (registry.ts onMoveFromBattlefield) — fired to
 * every other same-controller unit still at the vacated battlefield. moverInstance's zone/
 * battlefieldIndex are already updated to its destination by the time this fires.
 */
export const stealthyPursuer: SpecialCaseHandler = {
  cardId: "stealthy-pursuer",
  onAllyUnitMovedFromMyLocation: (ctx, _fromBattlefieldIndex, moverInstance) => {
    if (moverInstance.zone === "battlefield" && moverInstance.battlefieldIndex !== null) {
      moveInstanceToBattlefield(ctx.game, ctx.instance.instanceId, moverInstance.battlefieldIndex);
    } else {
      moveInstanceToBase(ctx.game, getCard, ctx.instance.instanceId);
    }
  },
};
