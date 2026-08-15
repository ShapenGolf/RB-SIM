import { getCard } from "../db";
import { returnInstanceToHand } from "./bounce-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Action] [Repeat] 2 Energy (You may pay the additional cost to repeat this spell's effect.)
 * [Stun] an attacking enemy unit. If it's already stunned, return it to its owner's hand instead.
 *
 * [Repeat] isn't wired up (~24 occurrences, deliberately not built — see docs/data-sourcing.md)
 * — only the base single resolution is implemented. Simplification: "an attacking enemy unit"
 * (a momentary combat-role concept this engine doesn't persist outside combat resolution) is
 * approximated as any enemy unit at a battlefield.
 */
export const existentialDread: SpecialCaseHandler = {
  cardId: "existential-dread",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId || i.zone !== "battlefield") return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!target) return;
    if (target.statuses.stunned) {
      returnInstanceToHand(ctx.game, target.instanceId);
    } else {
      target.statuses.stunned = true;
    }
  },
};
