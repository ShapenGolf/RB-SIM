import { getCard } from "../db";
import { attachEquipment } from "../../game/equip";
import { moveInstanceToBase } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Action] Move a friendly unit. You may attach an Equipment with the same controller to it.
 * This turn, that unit has "When I conquer, you may move me to my base."
 *
 * Known gap: granting a new conditional ability to an arbitrary instance for the turn isn't
 * modeled (no generic "grant an ability" mechanic — see docs/data-sourcing.md); only the move +
 * optional Equipment attach are implemented. Simplification: no stated destination for "move a
 * friendly unit" = send to base (established precedent, see charm.ts). No player choice of which
 * unit/Equipment — picks the first ones found.
 */
export const relentlessPursuit: SpecialCaseHandler = {
  cardId: "relentless-pursuit",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const unit = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== controller) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!unit) return;
    moveInstanceToBase(ctx.game, getCard, unit.instanceId);

    const gear = Object.values(ctx.game.instances).find(
      (i) => i.controller === controller && getCard(i.cardId).type === "gear" && !i.attachedTo,
    );
    if (gear) attachEquipment(ctx.game, getCard, gear.instanceId, unit.instanceId);
  },
};
