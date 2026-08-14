import type { SpecialCaseHandler } from "./types";

/** [Backline] When I hold, [Buff] all units here. */
export const enthusiasticPromoter: SpecialCaseHandler = {
  cardId: "enthusiastic-promoter",
  onHold: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    for (const id of [...slot.units["0"], ...slot.units["1"]]) {
      ctx.game.instances[id].statuses.buffed = true;
    }
  },
};
