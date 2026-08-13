import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const DEBUFF = -3;

/**
 * [Accelerate] When you play me, give enemy units -3 Might this turn, to a minimum of 1 Might.
 *
 * Simplification: the "to a minimum of 1" floor isn't separately modeled — see the identical
 * note on Leona (ogn-79) and docs/data-sourcing.md known simplifications.
 */
export const thousandTailedWatcher: SpecialCaseHandler = {
  cardId: "thousand-tailed-watcher",
  onPlay: (ctx) => {
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller === ctx.instance.controller) continue;
      const card = getCard(instance.cardId);
      if (card.type !== "unit" && card.type !== "champion") continue;
      instance.tempMightBonus += DEBUFF;
    }
  },
};
