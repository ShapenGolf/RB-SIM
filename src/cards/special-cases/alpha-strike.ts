import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealDistributedDamage } from "../../game/combat";

/**
 * [Action] Choose a friendly unit. It deals damage equal to its Might split among enemy units
 * at battlefields. Then for each unit this kills, gain 1 XP.
 *
 * Simplification: no player choice of how the damage is split (see docs/data-sourcing.md,
 * dealDistributedDamage) — fills each enemy unit's toughness in board order.
 */
export const alphaStrike: SpecialCaseHandler = {
  cardId: "alpha-strike",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const source = ctx.game.instances[targetInstanceId];
    if (!source || source.controller !== ctx.instance.controller) return;

    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const enemyIds = ctx.game.battlefields.flatMap((slot) => slot.units[opponentId]);
    const might = computeMight(ctx.game, getCard, source, "none");
    const destroyed = dealDistributedDamage(ctx.game, getCard, enemyIds, might);
    ctx.game.players[ctx.instance.controller].xp += destroyed.length;
  },
};
