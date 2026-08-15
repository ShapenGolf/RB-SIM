import type { SpecialCaseHandler } from "./types";

const BASE_COST = 12;

/**
 * [Empower] 12 Energy. This ability costs 1 Energy less for each rune you control.
 * [Empowered] I have [Deflect] and [Shield 3].
 * Known gap: Deflect stays unconditional (no override hook). Shield 3's defending Might bonus is
 * correctly gated below via defendingMightModifier (cancelling the flawed unconditional printed
 * value while not Empowered — same workaround as Serene Ascetic).
 */
export const grumpyRockbear: SpecialCaseHandler = {
  cardId: "grumpy-rockbear",
  empowerCost: (ctx) => {
    const runeCount = ctx.game.players[ctx.instance.controller].runePool.length;
    return { energy: Math.max(0, BASE_COST - runeCount) };
  },
  defendingMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 0 : -3),
};
