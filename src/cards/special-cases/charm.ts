import type { SpecialCaseHandler } from "./types";

/**
 * Move an enemy unit.
 *
 * Assumption (no further destination given in the reminder text, and we couldn't fetch the full
 * official rules for "Move"): interpreted as sending the target back to its base, the standard
 * disruptive "pull off the battlefield" effect — only meaningful if it's currently committed to
 * one. A no-op if the target is an ally or already on base.
 */
export const charm: SpecialCaseHandler = {
  cardId: "charm",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    target.zone = "base";
    target.battlefieldIndex = null;
    ctx.game.players[target.controller].base.push(targetInstanceId);
  },
};
