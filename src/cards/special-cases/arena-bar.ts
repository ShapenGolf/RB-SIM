import type { SpecialCaseHandler } from "./types";

/** Exhaust: Buff an exhausted friendly unit. */
export const arenaBar: SpecialCaseHandler = {
  cardId: "arena-bar",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    if (!target.exhausted) return;
    target.statuses.buffed = true;
  },
};
