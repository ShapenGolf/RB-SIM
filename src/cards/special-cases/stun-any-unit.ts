import type { SpecialCaseHandler } from "./types";

/**
 * Stun a unit. (It doesn't deal combat damage this turn.) Unlike Stunning Blow, this targets
 * ANY unit, friendly or enemy — shared by Rune Prison (spell) and Solari Shieldbearer (onPlay).
 */
export const stunAnyUnit: SpecialCaseHandler = {
  cardId: "stun-any-unit",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.statuses.stunned = true;
  },
};
