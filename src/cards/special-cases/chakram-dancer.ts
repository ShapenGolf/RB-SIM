import type { SpecialCaseHandler } from "./types";

/** [Ambush] When you play me, give your other units here [Shield] this turn. */
export const chakramDancer: SpecialCaseHandler = {
  cardId: "chakram-dancer",
  onPlay: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    for (const id of slot.units[ctx.instance.controller]) {
      if (id === ctx.instance.instanceId) continue;
      ctx.game.instances[id].grantedThisTurn.push({ keyword: "shield", value: 1 });
    }
  },
};
