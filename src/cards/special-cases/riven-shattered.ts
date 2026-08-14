import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * [Weaponmaster] When I attack, choose an enemy unit here. Deal 2 to it for each Equipment attached to me.
 * No player choice among multiple eligible enemies (same simplification as other onAttack
 * "choose a unit" effects, e.g. Leona, Determined) — targets the first enemy unit at this Battlefield.
 */
const DAMAGE_PER_EQUIPMENT = 2;

export const rivenShattered: SpecialCaseHandler = {
  cardId: "riven-shattered",
  onAttack: (ctx) => {
    if (ctx.instance.equipment.length === 0) return;
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const enemyId = slot.units[opponentId][0];
    if (!enemyId) return;
    dealSpellDamage(ctx.game, getCard, enemyId, ctx.instance.equipment.length * DAMAGE_PER_EQUIPMENT, ctx.instance.controller);
  },
};
