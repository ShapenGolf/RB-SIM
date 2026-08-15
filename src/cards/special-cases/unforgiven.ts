import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";
import { moveInstanceToBase, moveInstanceToBattlefield } from "./move-helpers";

/**
 * 2 Energy, Exhaust: Move a friendly unit to or from its base.
 *
 * Simplification: no player choice of destination Battlefield for the "to a battlefield"
 * direction (see docs/data-sourcing.md) — moves it to the controller's first Battlefield.
 */
export const unforgiven: SpecialCaseHandler = {
  cardId: "unforgiven",
  activatedAbilityCost: { energy: 2, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;

    if (target.zone === "base") {
      moveInstanceToBattlefield(ctx.game, targetInstanceId, 0);
    } else if (target.zone === "battlefield") {
      moveInstanceToBase(ctx.game, getCard, targetInstanceId);
    }
  },
};
