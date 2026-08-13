import type { SpecialCaseHandler } from "./types";

/** When I attack, give me +2 Might this turn if there is a ready enemy unit here. */
export const duneDrake: SpecialCaseHandler = {
  cardId: "dune-drake",
  onAttack: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const enemyController = ctx.instance.controller === "0" ? "1" : "0";
    const hasReadyEnemy = slot.units[enemyController].some((id) => !ctx.game.instances[id]?.exhausted);
    if (hasReadyEnemy) ctx.instance.tempMightBonus += 2;
  },
};
