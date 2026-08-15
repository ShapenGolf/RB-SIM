import { getCard } from "../db";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] [Backline] (already generic.) When you play me from face down on your turn, you may
 * move an enemy unit at a different location to my battlefield.
 *
 * [Hidden]'s face-down zone isn't modeled — "played from face down" is approximated as always
 * true (a documented simplification, matching precedent across the pool). Simplification: no
 * player choice of which enemy unit (see docs/data-sourcing.md) — picks the first one found at a
 * different battlefield.
 */
export const evelynnEntrancing: SpecialCaseHandler = {
  cardId: "evelynn-entrancing",
  onPlay: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const myIndex = ctx.instance.battlefieldIndex;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId || i.zone !== "battlefield" || i.battlefieldIndex === myIndex) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!target) return;
    moveInstanceToBattlefield(ctx.game, target.instanceId, myIndex);
  },
};
