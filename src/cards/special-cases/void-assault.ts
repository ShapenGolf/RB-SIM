import { getCard } from "../db";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * Move a friendly unit, then move an enemy unit. (If they both move to a battlefield you don't
 * control, you're the attacker.)
 *
 * Known gap: "you become the attacker" isn't modeled — moving both units to the same battlefield
 * doesn't trigger a Showdown here (see docs/data-sourcing.md, combat is only ever entered via the
 * normal attack move). Simplification: no player choice of which units/battlefield — moves the
 * controller's first unit and an enemy unit to the first battlefield the controller doesn't
 * control.
 */
export const voidAssault: SpecialCaseHandler = {
  cardId: "void-assault",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const enemyId = controller === "0" ? "1" : "0";
    const index = ctx.game.battlefields.findIndex((slot) => slot.controller !== controller);
    if (index === -1) return;

    const friendlyUnit = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== controller) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (friendlyUnit) moveInstanceToBattlefield(ctx.game, friendlyUnit.instanceId, index);

    const enemyUnit = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (enemyUnit) moveInstanceToBattlefield(ctx.game, enemyUnit.instanceId, index);
  },
};
