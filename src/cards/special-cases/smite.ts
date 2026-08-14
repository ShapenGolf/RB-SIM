import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";

const DAMAGE = 3;

/**
 * [Action] Deal 3 to a unit at a battlefield. If it would die this turn, banish it instead.
 *
 * Bypasses dealSpellDamage's normal trash destination for the lethal case (banishment instead)
 * — this also means the onAllyKillWithSpell trash-reactive broadcast doesn't fire for a Smite
 * kill, a small, documented gap (see docs/data-sourcing.md).
 */
export const smite: SpecialCaseHandler = {
  cardId: "smite",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield" || target.battlefieldIndex === null) return;

    const toughness = computeMight(ctx.game, getCard, target, "none");
    if (target.damage + DAMAGE >= toughness) {
      const slot = ctx.game.battlefields[target.battlefieldIndex];
      slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
      delete ctx.game.instances[targetInstanceId];
      ctx.game.players[target.controller].banishment.push(target.cardId);
    } else {
      dealSpellDamage(ctx.game, getCard, targetInstanceId, DAMAGE, ctx.instance.controller);
    }
  },
};
