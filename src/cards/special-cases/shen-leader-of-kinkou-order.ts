import type { SpecialCaseHandler } from "./types";

/** [Shield] When I hold, if there is exactly one other unit you control here, you score 1 point. */
export const shenLeaderOfKinkouOrder: SpecialCaseHandler = {
  cardId: "shen-leader-of-kinkou-order",
  onHold: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const others = slot.units[ctx.instance.controller].filter((id) => id !== ctx.instance.instanceId);
    if (others.length !== 1) return;
    ctx.game.players[ctx.instance.controller].points += 1;
  },
};
