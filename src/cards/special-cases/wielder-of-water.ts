import type { SpecialCaseHandler } from "./types";

function isAlone(ctx: Parameters<NonNullable<SpecialCaseHandler["attackingMightModifier"]>>[0]): boolean {
  if (ctx.instance.battlefieldIndex === null) return false;
  const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
  return slot.units[ctx.instance.controller].length === 1;
}

/** While I'm attacking or defending alone, I have +2 Might. */
export const wielderOfWater: SpecialCaseHandler = {
  cardId: "wielder-of-water",
  attackingMightModifier: (ctx) => (isAlone(ctx) ? 2 : 0),
  defendingMightModifier: (ctx) => (isAlone(ctx) ? 2 : 0),
};
