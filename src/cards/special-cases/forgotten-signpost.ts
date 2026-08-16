import { getCard } from "../db";
import { moveInstanceToBase, moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Action][>] Exhaust a unit you control, Exhaust: Move a different unit you control to the
 * location of the unit you exhausted to pay for this ability.
 *
 * Simplification: no dedicated ActivatedAbilityCost type for "exhaust a chosen OTHER unit" (see
 * docs/data-sourcing.md) — auto-picks the controller's first other ready friendly unit to
 * exhaust as the cost. `targetInstanceId` selects which unit gets moved.
 */
export const forgottenSignpost: SpecialCaseHandler = {
  cardId: "forgotten-signpost",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    const t = getCard(target.cardId).type;
    if (t !== "unit" && t !== "champion") return;

    const costUnit = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller || i.instanceId === target.instanceId || i.exhausted) return false;
      const ct = getCard(i.cardId).type;
      return ct === "unit" || ct === "champion";
    });
    if (!costUnit) return;
    const destinationZone = costUnit.zone;
    const destinationIndex = costUnit.battlefieldIndex;
    costUnit.exhausted = true;

    if (destinationZone === "battlefield" && destinationIndex !== null) {
      moveInstanceToBattlefield(ctx.game, target.instanceId, destinationIndex);
    } else {
      moveInstanceToBase(ctx.game, getCard, target.instanceId);
    }
  },
};
