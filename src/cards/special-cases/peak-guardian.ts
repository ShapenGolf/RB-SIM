import type { SpecialCaseHandler } from "./types";

/** When you play me, buff me. Then, if I am at a battlefield, buff all other friendly units there. */
export const peakGuardian: SpecialCaseHandler = {
  cardId: "peak-guardian",
  onPlay: (ctx) => {
    ctx.instance.statuses.buffed = true;
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    for (const id of slot.units[ctx.instance.controller]) {
      if (id === ctx.instance.instanceId) continue;
      ctx.game.instances[id].statuses.buffed = true;
    }
  },
};
