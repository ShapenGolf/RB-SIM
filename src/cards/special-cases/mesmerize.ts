import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const MIGHT_PENALTY = 2;

/**
 * [Reaction] Choose one — Return a friendly unit to its owner's hand. / Give an enemy unit -2
 * Might this turn.
 *
 * Reaction timing isn't modeled — resolves immediately. Simplification: always picks the debuff
 * mode (see docs/data-sourcing.md) — bouncing your own unit is rarely what you want, so the
 * strictly offensive option is used. No player choice of which enemy unit — picks the first one
 * found.
 */
export const mesmerize: SpecialCaseHandler = {
  cardId: "mesmerize",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (target) target.tempMightBonus -= MIGHT_PENALTY;
  },
};
