import type { SpecialCaseHandler } from "./types";

const BASE_COST = 12;

/**
 * [Empower] 12 Energy. This ability costs 1 Energy less for each rune you control.
 * [Empowered] I have +3 Might.
 */
export const frostcoatMother: SpecialCaseHandler = {
  cardId: "frostcoat-mother",
  empowerCost: (ctx) => {
    const runeCount = ctx.game.players[ctx.instance.controller].runePool.length;
    return { energy: Math.max(0, BASE_COST - runeCount) };
  },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 3 : 0),
};
