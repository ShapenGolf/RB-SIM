import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * [Action] For each friendly unit, you may spend its buff to ready it. Then buff all friendly
 * units.
 *
 * Simplification: no player choice — spends a buff to ready any exhausted buffed friendly unit
 * (strictly beneficial; a ready unbuffed unit gains nothing from keeping the buff at that
 * moment), then buffs every friendly unit that doesn't already have one.
 */
export const overtOperation: SpecialCaseHandler = {
  cardId: "overt-operation",
  onPlay: (ctx) => {
    const friendlies = Object.values(ctx.game.instances).filter((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    for (const unit of friendlies) {
      if (unit.statuses.buffed && unit.exhausted) {
        unit.statuses.buffed = false;
        unit.exhausted = false;
      }
    }
    for (const unit of friendlies) {
      unit.statuses.buffed = true;
    }
  },
};
