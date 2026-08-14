import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { applyStun } from "./stun";

const MIGHT_BONUS = 1;

/**
 * [Action] Give a friendly unit +1 Might this turn and [Stun] an enemy unit at its location.
 *
 * Simplification: no player choice of which enemy unit is stunned (see docs/data-sourcing.md) —
 * stuns the first one found at the target's battlefield.
 */
export const heroicCharge: SpecialCaseHandler = {
  cardId: "heroic-charge",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.tempMightBonus += MIGHT_BONUS;

    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return;
    const opponentId = target.controller === "0" ? "1" : "0";
    const slot = ctx.game.battlefields[target.battlefieldIndex];
    const enemyId = slot.units[opponentId][0];
    if (!enemyId) return;
    const enemy = ctx.game.instances[enemyId];
    if (!enemy) return;
    applyStun(ctx.game, getCard, enemy, ctx.instance.controller);
  },
};
