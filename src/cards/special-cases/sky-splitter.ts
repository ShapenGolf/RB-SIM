import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";
import { computeMight } from "../../game/might";

/**
 * This spell's Energy cost is reduced by the highest Might among units you control.
 * Deal 5 to a unit at a battlefield.
 */
export const skySplitter: SpecialCaseHandler = {
  cardId: "sky-splitter",
  needsPlayTarget: true,
  costReduction: (ctx) => {
    let highest = 0;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const card = getCard(instance.cardId);
      if (card.type !== "unit" && card.type !== "champion") continue;
      highest = Math.max(highest, computeMight(ctx.game, getCard, instance, "none"));
    }
    return highest;
  },
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.damage += 5;
    const toughness = computeMight(ctx.game, getCard, target, "none");
    if (target.damage >= toughness) {
      destroyInstance(ctx.game, getCard, targetInstanceId);
    }
  },
};
