import type { SpecialCaseHandler } from "./types";
import { playCardIgnoringCost } from "../../game/playFree";

/** Banish a friendly unit, then play it to base, ignoring its cost. */
export const portalRescue: SpecialCaseHandler = {
  cardId: "portal-rescue",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;

    if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
      const slot = ctx.game.battlefields[target.battlefieldIndex];
      slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    } else {
      const owner = ctx.game.players[target.controller];
      owner.base = owner.base.filter((id) => id !== targetInstanceId);
    }
    delete ctx.game.instances[targetInstanceId];
    ctx.game.players[target.controller].banishment.push(target.cardId);
    playCardIgnoringCost(ctx.game, target.controller, target.cardId);
  },
};
