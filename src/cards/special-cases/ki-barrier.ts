import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const PREVENTION_AMOUNT = 7;

/**
 * [Reaction] Choose a unit. Prevent the next 7 damage that would be dealt to it this turn.
 * (Opponents can assign it extra combat damage to kill it.)
 *
 * Reaction timing isn't modeled. Simplification: no player choice of which unit — protects the
 * controller's strongest friendly unit.
 */
export const kiBarrier: SpecialCaseHandler = {
  cardId: "ki-barrier",
  onPlay: (ctx) => {
    let target: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!target || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, target, "none")) {
        target = instance;
      }
    }
    if (target) target.damagePreventionPool += PREVENTION_AMOUNT;
  },
};
