import { getCard } from "../db";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When I hold, at the start of your next Main Phase, you may move an enemy unit to this
 * battlefield.
 *
 * Simplification: the delay to "the start of your next Main Phase" isn't modeled — resolves
 * immediately on hold instead (a documented approximation, matching how Reaction timing is
 * already approximated elsewhere). No player choice of which enemy unit (see
 * docs/data-sourcing.md) — picks the first one found.
 */
export const iascylla: SpecialCaseHandler = {
  cardId: "iascylla",
  onHold: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!target) return;
    moveInstanceToBattlefield(ctx.game, target.instanceId, ctx.instance.battlefieldIndex);
  },
};
