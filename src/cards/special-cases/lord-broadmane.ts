import type { SpecialCaseHandler } from "./types";

/** [Ambush] When you play me, give your other units here [Assault] this turn. */
export const lordBroadmane: SpecialCaseHandler = {
  cardId: "lord-broadmane",
  onPlay: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    for (const id of slot.units[ctx.instance.controller]) {
      if (id === ctx.instance.instanceId) continue;
      ctx.game.instances[id].grantedThisTurn.push({ keyword: "assault", value: 1 });
    }
  },
};
