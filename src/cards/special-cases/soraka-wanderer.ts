import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { SpecialCaseHandler } from "./types";

/**
 * I must be assigned combat damage last. If another unit you control here would die, if it has
 * less Might than me, instead heal it, exhaust it, and recall it. (Send it to base. This isn't a
 * move.)
 *
 * "Assigned combat damage last" uses `hasConditionalBackline` (no printed Backline keyword — see
 * game/combat.ts orderForDamageAssignment). The death-ward uses `preventsAllyDeathHere`, checked
 * at the top of game/combat.ts destroyInstance — the single chokepoint every death goes through.
 */
export const sorakaWanderer: SpecialCaseHandler = {
  cardId: "soraka-wanderer",
  hasConditionalBackline: () => true,
  preventsAllyDeathHere: (ctx, dyingInstance) => {
    if (ctx.instance.battlefieldIndex === null || ctx.instance.battlefieldIndex !== dyingInstance.battlefieldIndex) {
      return false;
    }
    const myMight = computeMight(ctx.game, getCard, ctx.instance, "none");
    const dyingMight = computeMight(ctx.game, getCard, dyingInstance, "none");
    return dyingMight < myMight;
  },
};
