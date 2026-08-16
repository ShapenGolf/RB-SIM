import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const MULTIPLIER = 2;

/**
 * [Hidden] [Reaction] Choose a unit. Double all damage that would be dealt to it this turn.
 *
 * [Hidden]'s face-down timing isn't modeled. Simplification: no player choice of which unit —
 * targets the strongest enemy unit (the offensive use case).
 */
export const lotusTrap: SpecialCaseHandler = {
  cardId: "lotus-trap",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let target: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!target || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, target, "none")) {
        target = instance;
      }
    }
    if (target) target.damageMultiplier *= MULTIPLIER;
  },
};
