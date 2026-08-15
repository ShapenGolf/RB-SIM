import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { SpecialCaseHandler } from "./types";

const MIGHT_DELTA = 1;
const MIGHT_FLOOR = 1;

/**
 * [Reaction] Choose a battlefield. Give friendly units there +1 Might this turn and enemy units
 * there -1 Might this turn, to a minimum of 1 Might.
 *
 * Reaction timing isn't modeled. Simplification: no player choice of which battlefield — picks
 * the one with the most enemy units.
 */
export const siphonPower: SpecialCaseHandler = {
  cardId: "siphon-power",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const enemyId = controller === "0" ? "1" : "0";
    let bestIndex = -1;
    let bestCount = -1;
    ctx.game.battlefields.forEach((slot, index) => {
      if (slot.units[enemyId].length > bestCount) {
        bestCount = slot.units[enemyId].length;
        bestIndex = index;
      }
    });
    if (bestIndex === -1) return;
    const slot = ctx.game.battlefields[bestIndex];
    for (const id of slot.units[controller]) {
      const instance = ctx.game.instances[id];
      if (instance) instance.tempMightBonus += MIGHT_DELTA;
    }
    for (const id of slot.units[enemyId]) {
      const instance = ctx.game.instances[id];
      if (!instance) continue;
      if (computeMight(ctx.game, getCard, instance, "none") > MIGHT_FLOOR) instance.tempMightBonus -= MIGHT_DELTA;
    }
  },
};
