import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { attachEquipment } from "../../game/equip";

/**
 * [Weaponmaster] (generic keyword, already wired.)
 * You may pay Body Rune as an additional cost to play me. When you play me, if you paid the
 * additional cost, move an enemy gear to your base. You control it until I leave the board. If
 * it's an Equipment, attach it to me.
 *
 * Simplification: the Domain-Rune additional cost is never charged (established precedent, see
 * crescent-guardian.ts). "You control it until I leave the board" is approximated as a permanent
 * control transfer (same precedent as possession.ts) — no revert-on-leave tracking exists.
 * No player choice of which enemy gear (see docs/data-sourcing.md) — takes the first one found.
 */
export const akshanMischievous: SpecialCaseHandler = {
  cardId: "akshan-mischievous",
  additionalPlayCostEnergy: () => 0,
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const gear = Object.values(ctx.game.instances).find(
      (i) => i.controller === enemyId && getCard(i.cardId).type === "gear",
    );
    if (!gear) return;

    if (gear.attachedTo) {
      const wearer = ctx.game.instances[gear.attachedTo];
      if (wearer) wearer.equipment = wearer.equipment.filter((id) => id !== gear.instanceId);
      gear.attachedTo = null;
    } else {
      ctx.game.players[enemyId].base = ctx.game.players[enemyId].base.filter((id) => id !== gear.instanceId);
    }
    gear.zone = "base";
    gear.battlefieldIndex = null;
    gear.controller = ctx.instance.controller;
    ctx.game.players[ctx.instance.controller].base.push(gear.instanceId);

    if (getCard(gear.cardId).equipCost) {
      attachEquipment(ctx.game, getCard, gear.instanceId, ctx.instance.instanceId);
    }
  },
};
