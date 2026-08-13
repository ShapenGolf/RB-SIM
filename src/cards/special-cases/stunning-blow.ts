import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { applyStun } from "./stun";

/** Stun an enemy Unit. */
export const stunningBlow: SpecialCaseHandler = {
  cardId: "stunning-blow",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    applyStun(ctx.game, getCard, target, ctx.instance.controller);
  },
};
