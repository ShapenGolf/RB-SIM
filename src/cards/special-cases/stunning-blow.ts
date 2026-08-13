import type { SpecialCaseHandler } from "./types";

/** Stun an enemy Unit. */
export const stunningBlow: SpecialCaseHandler = {
  cardId: "stunning-blow",
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    target.statuses.stunned = true;
  },
};
