import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { applyStun } from "./stun";

/** [Shield] When I attack, stun an enemy unit here. */
export const leonaDetermined: SpecialCaseHandler = {
  cardId: "leona-determined",
  onAttack: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const enemyId = slot.units[opponentId][0];
    if (!enemyId) return;
    const enemy = ctx.game.instances[enemyId];
    if (!enemy) return;
    applyStun(ctx.game, getCard, enemy, ctx.instance.controller);
  },
};
