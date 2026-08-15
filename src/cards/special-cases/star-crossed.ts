import { getCard } from "../db";
import { returnInstanceToHand } from "./bounce-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Return a friendly unit and an enemy unit to their owners' hands.
 *
 * Reaction timing isn't modeled. Simplification: no player choice of which units — picks the
 * first friendly and first enemy unit found.
 */
export const starCrossed: SpecialCaseHandler = {
  cardId: "star-crossed",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const friendly = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (friendly) returnInstanceToHand(ctx.game, friendly.instanceId);

    const enemy = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (enemy) returnInstanceToHand(ctx.game, enemy.instanceId);
  },
};
