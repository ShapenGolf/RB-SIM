import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/**
 * You may kill a friendly gear as an additional cost to play me. When you play me, if you paid
 * the additional cost, kill a gear.
 *
 * Approximated as an optional play-target effect (killing the chosen friendly gear as this
 * resolves) rather than a true pre-payment cost gate — same simplification as Cruel Patron. The
 * bonus "kill a gear" targets the first enemy gear found (no separate target choice modeled).
 */
export const zaunPunk: SpecialCaseHandler = {
  cardId: "zaun-punk",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller || getCard(target.cardId).type !== "gear") return;
    destroyInstance(ctx.game, getCard, targetInstanceId);

    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const enemyGear = Object.values(ctx.game.instances).find(
      (i) => i.controller === opponentId && getCard(i.cardId).type === "gear",
    );
    if (enemyGear) destroyInstance(ctx.game, getCard, enemyGear.instanceId);
  },
};
