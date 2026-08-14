import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * Choose an equipped friendly unit. It deals damage equal to its Might to an enemy unit. Then
 * detach an Equipment from it.
 *
 * Simplification: no separate enemy-target picker (see docs/data-sourcing.md) — hits the first
 * enemy unit found anywhere.
 */
export const strikeDown: SpecialCaseHandler = {
  cardId: "strike-down",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller || target.equipment.length === 0) return;

    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const enemy = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== opponentId) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (enemy) {
      const might = computeMight(ctx.game, getCard, target, "none");
      dealSpellDamage(ctx.game, getCard, enemy.instanceId, might, ctx.instance.controller);
    }

    const gearId = target.equipment[0];
    const gear = ctx.game.instances[gearId];
    if (gear) {
      target.equipment = target.equipment.filter((id) => id !== gearId);
      gear.attachedTo = null;
      ctx.game.players[gear.controller].base.push(gearId);
    }
  },
};
