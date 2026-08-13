import type { SpecialCaseHandler } from "./types";

/**
 * [Shield] Exhaust: Buff me. I can have any number of buffs.
 *
 * The shared Buff status (CardInstance.statuses.buffed) is a non-stacking boolean everywhere
 * else in the engine — Lee Sin is the one card that stacks it, so its count is tracked
 * separately via the otherwise-unused CardInstance.xp field rather than changing the shared
 * representation for one card.
 */
export const leeSin: SpecialCaseHandler = {
  cardId: "lee-sin",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    ctx.instance.xp += 1;
  },
  staticMightModifier: (ctx) => ctx.instance.xp,
};
