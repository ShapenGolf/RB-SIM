import type { SpecialCaseHandler } from "./types";

/**
 * When you hold here, buff a unit here. (If it doesn't have a buff, it gets a +1 Might buff.)
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — buffs the first
 * friendly unit found here.
 */
export const navoriFightingPit: SpecialCaseHandler = {
  cardId: "navori-fighting-pit",
  onBeginningWhileHeld: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const targetId = slot.units[ctx.instance.controller][0];
    if (!targetId) return;
    const target = ctx.game.instances[targetId];
    if (target) target.statuses.buffed = true;
  },
};
