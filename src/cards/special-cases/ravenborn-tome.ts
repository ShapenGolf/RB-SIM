import type { SpecialCaseHandler } from "./types";

/** Exhaust: The next spell you play this turn deals 1 Bonus Damage. */
export const ravenbornTome: SpecialCaseHandler = {
  cardId: "ravenborn-tome",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    ctx.game.players[ctx.instance.controller].nextSpellBonusDamage += 1;
  },
};
