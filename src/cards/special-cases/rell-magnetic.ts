import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import { attachEquipment } from "../../game/equip";

const MAX_ENERGY_COST = 2;

/**
 * [Tank] When I attack, you may play an Equipment with Energy cost no more than 2 Energy,
 * ignoring its cost, and attach it to me.
 *
 * Simplification: no player choice of which Equipment (see docs/data-sourcing.md) — plays the
 * first eligible one found in hand. playCardIgnoringCost also ignores Power cost, unlike the
 * printed text (see soulgorger.ts for the same simplification).
 */
export const rellMagnetic: SpecialCaseHandler = {
  cardId: "rell-magnetic",
  onAttack: (ctx) => {
    const controller = ctx.instance.controller;
    const player = ctx.game.players[controller];
    const handIdx = player.hand.findIndex((id) => {
      const card = getCard(id);
      return card.type === "gear" && Boolean(card.equipCost) && card.energyCost !== null && card.energyCost <= MAX_ENERGY_COST;
    });
    if (handIdx === -1) return;
    const [chosen] = player.hand.splice(handIdx, 1);
    playCardIgnoringCost(ctx.game, controller, chosen);
    const newInstanceId = player.base.find((id) => ctx.game.instances[id]?.cardId === chosen);
    if (newInstanceId) attachEquipment(ctx.game, getCard, newInstanceId, ctx.instance.instanceId);
  },
};
