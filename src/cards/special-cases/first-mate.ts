import type { SpecialCaseHandler } from "./types";

/** When you play me, ready another unit. */
export const firstMate: SpecialCaseHandler = {
  cardId: "first-mate",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId || targetInstanceId === ctx.instance.instanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.exhausted = false;
  },
};
