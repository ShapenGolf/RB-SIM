import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Deflect] (generic keyword, handled elsewhere.)
 * When I move to a battlefield, give a friendly unit my keywords and +Might equal to my Might
 * this turn.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — picks the
 * controller's strongest OTHER friendly unit, anywhere.
 */
export const katoTheArm: SpecialCaseHandler = {
  cardId: "kato-the-arm",
  onMove: (ctx) => {
    let best: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (instance.instanceId === ctx.instance.instanceId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!best || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, best, "none")) {
        best = instance;
      }
    }
    if (!best) return;
    const katoMight = computeMight(ctx.game, getCard, ctx.instance, "none");
    best.tempMightBonus += katoMight;
    const card = getCard(ctx.instance.cardId);
    best.grantedThisTurn.push(...card.keywords);
  },
};
