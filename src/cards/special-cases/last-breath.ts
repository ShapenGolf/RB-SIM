import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * Ready a friendly unit. It deals damage equal to its Might to an enemy unit at a battlefield.
 *
 * Simplification: no separate enemy-target picker (see docs/data-sourcing.md) — hits the first
 * enemy unit found at any battlefield.
 */
export const lastBreath: SpecialCaseHandler = {
  cardId: "last-breath",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.exhausted = false;

    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    let enemyId: string | undefined;
    for (const slot of ctx.game.battlefields) {
      enemyId = slot.units[opponentId][0];
      if (enemyId) break;
    }
    if (!enemyId) return;
    const might = computeMight(ctx.game, getCard, target, "none");
    dealSpellDamage(ctx.game, getCard, enemyId, might, ctx.instance.controller);
  },
};
