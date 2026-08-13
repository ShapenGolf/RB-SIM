import type { SpecialCaseHandler } from "./types";

/**
 * Move a friendly unit and ready it.
 *
 * Assumption (no destination given in the reminder text, same as Charm ogn-43): if the target
 * is at a battlefield, it's sent back to base; if already on base, only the ready happens.
 */
export const rideTheWind: SpecialCaseHandler = {
  cardId: "ride-the-wind",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;

    if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
      const slot = ctx.game.battlefields[target.battlefieldIndex];
      slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
      target.zone = "base";
      target.battlefieldIndex = null;
      ctx.game.players[target.controller].base.push(targetInstanceId);
    }
    target.exhausted = false;
  },
};
