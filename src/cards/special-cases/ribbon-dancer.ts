import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * When I move to a battlefield, give another friendly unit +1 Might this turn.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — picks the first
 * other friendly unit found anywhere (the text has no "here" qualifier).
 */
export const ribbonDancer: SpecialCaseHandler = {
  cardId: "ribbon-dancer",
  onMove: (ctx) => {
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.instanceId === ctx.instance.instanceId) return false;
      if (i.controller !== ctx.instance.controller) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (!target) return;
    target.tempMightBonus += 1;
  },
};
