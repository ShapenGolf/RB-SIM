import type { SpecialCaseHandler } from "./types";

/** When you play me, buff another friendly unit. */
export const pitRookie: SpecialCaseHandler = {
  cardId: "pit-rookie",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId || targetInstanceId === ctx.instance.instanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.statuses.buffed = true;
  },
};
