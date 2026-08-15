import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { moveInstanceToBase } from "./move-helpers";

/**
 * When you play this, you may move an enemy unit. When you move an enemy unit, you may exhaust
 * this to [Stun] it.
 *
 * Simplification: no stated destination for "move an enemy unit" = send it to base (established
 * precedent, see charm.ts / imposing-challenger.ts). Both "you may" clauses auto-resolve yes (no
 * real downside — see docs/data-sourcing.md). The "when you move an enemy unit" trigger only
 * covers this card's own play (no generic broadcast for arbitrary enemy-unit moves exists yet).
 */
export const blastCone: SpecialCaseHandler = {
  cardId: "blast-cone",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!target) return;
    moveInstanceToBase(ctx.game, getCard, target.instanceId);
    target.statuses.stunned = true;
    ctx.instance.exhausted = true;
  },
};
