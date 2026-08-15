import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";
import { moveInstanceToBattlefield } from "./move-helpers";

function isUnitOrChampion(cardId: string): boolean {
  const t = getCard(cardId).type;
  return t === "unit" || t === "champion";
}

/**
 * Move a unit you control to a battlefield you control. Then, choose an opponent. They move a
 * unit they control to the same battlefield.
 *
 * Simplification: no player choice of which units/battlefield (see docs/data-sourcing.md) —
 * targets the first battlefield the controller controls, and the first unit found for each side.
 */
export const callToBattle: SpecialCaseHandler = {
  cardId: "call-to-battle",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const index = ctx.game.battlefields.findIndex((slot) => slot.controller === controller);
    if (index === -1) return;

    const myUnit = Object.values(ctx.game.instances).find(
      (i) =>
        i.controller === controller &&
        isUnitOrChampion(i.cardId) &&
        !(i.zone === "battlefield" && i.battlefieldIndex === index),
    );
    if (myUnit) moveInstanceToBattlefield(ctx.game, myUnit.instanceId, index);

    const enemyId = controller === "0" ? "1" : "0";
    const enemyUnit = Object.values(ctx.game.instances).find(
      (i) =>
        i.controller === enemyId &&
        isUnitOrChampion(i.cardId) &&
        !(i.zone === "battlefield" && i.battlefieldIndex === index),
    );
    if (enemyUnit) moveInstanceToBattlefield(ctx.game, enemyUnit.instanceId, index);
  },
};
