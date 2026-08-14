import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { applyStun } from "./stun";

/**
 * [Ambush] When I attack, [Stun] an enemy unit here.
 *
 * Simplification: no player choice of which enemy unit (see docs/data-sourcing.md) — stuns the
 * first one found at the battlefield.
 */
export const viPeacekeeper: SpecialCaseHandler = {
  cardId: "vi-peacekeeper",
  onAttack: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const targetId = slot.units[opponentId][0];
    if (!targetId) return;
    const target = ctx.game.instances[targetId];
    if (!target) return;
    applyStun(ctx.game, getCard, target, ctx.instance.controller);
  },
};
