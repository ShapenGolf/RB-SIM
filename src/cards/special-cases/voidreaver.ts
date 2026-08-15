import type { SpecialCaseHandler } from "./types";

/**
 * When you win a combat, gain 1 XP.
 * Spend 1 XP, Exhaust: [Buff] a unit.
 * Spend 2 XP, Exhaust: Move an exhausted friendly unit from a battlefield to its base.
 *
 * Known gap: the two "Spend N XP, Exhaust: ..." activated abilities aren't modeled — a Legend
 * only has one activatedAbilityCost/onActivate slot, and these two share a single Exhaust
 * resource with different XP costs and effects, which the current shape can't express (see
 * docs/data-sourcing.md). Only the passive "when you win a combat, gain 1 XP" is implemented.
 */
export const voidreaver: SpecialCaseHandler = {
  cardId: "voidreaver",
  onWinCombat: (ctx) => {
    ctx.game.players[ctx.instance.controller].xp += 1;
  },
};
