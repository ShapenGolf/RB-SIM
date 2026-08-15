import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";
import { moveInstanceToBase } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When I defend, you may kill me to move an attacking unit to its base.
 *
 * Simplification: the "may" always resolves yes (no real downside — this unit was about to take
 * combat damage anyway). No player choice of which attacking unit — picks the first one found.
 */
export const overzealousFan: SpecialCaseHandler = {
  cardId: "overzealous-fan",
  onDefend: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const attackerId = slot.units[enemyId][0];
    if (!attackerId) return;
    destroyInstance(ctx.game, getCard, ctx.instance.instanceId);
    moveInstanceToBase(ctx.game, getCard, attackerId);
  },
};
