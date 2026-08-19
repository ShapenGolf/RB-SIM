import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { moveInstanceToBase } from "./move-helpers";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const MIGHT_THRESHOLD = 3;

/**
 * Move a unit with 3 Might or less.
 * [Flow] is now wired generically (see game/moves.ts playFromTrash, cards/db.ts parseFlowCost) —
 * this handler's onPlay is reused verbatim whether played from hand or from trash via Flow.
 *
 * Assumption (see charm.ts): "Move" with no destination given means send to base.
 * Simplification: no player choice of target — moves the strongest eligible ENEMY unit at a
 * battlefield (best disruption).
 */
export const twilightStep: SpecialCaseHandler = {
  cardId: "twilight-step",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let target: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      const might = computeMight(ctx.game, getCard, instance, "none");
      if (might > MIGHT_THRESHOLD) continue;
      if (!target || might > computeMight(ctx.game, getCard, target, "none")) target = instance;
    }
    if (target) moveInstanceToBase(ctx.game, getCard, target.instanceId);
  },
};
