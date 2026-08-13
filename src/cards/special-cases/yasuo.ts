import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import { SpecialCaseEngine } from "./registry";

/** When I attack, deal damage equal to my Might to an enemy unit here. */
export const yasuo: SpecialCaseHandler = {
  cardId: "yasuo",
  onAttack: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const enemyController = ctx.instance.controller === "0" ? "1" : "0";
    const targetId = slot.units[enemyController][0];
    if (!targetId) return;
    const target = ctx.game.instances[targetId];
    if (!target) return;

    target.damage += computeMight(ctx.game, getCard, ctx.instance, "attacking");
    const toughness = computeMight(ctx.game, getCard, target, "none");
    if (target.damage >= toughness) {
      destroyInstance(ctx.game, getCard, targetId);
      SpecialCaseEngine.onAllyKillUnit(ctx.game, getCard, ctx.instance.controller, target);
    }
  },
};
