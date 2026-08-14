import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";
import { playCardIgnoringCost } from "../../game/playFree";

const MAX_ENERGY_COST = 7;

/**
 * When you play me, you may kill a friendly gear. If you do, you may play a gear with Energy
 * cost no more than 7 Energy from hand this turn, ignoring its Energy cost. (You must still pay
 * its Power cost.)
 *
 * Simplification: only triggers when there's both a friendly gear to kill AND an eligible gear
 * in hand to play for free (see docs/data-sourcing.md) — killing your own gear for nothing
 * isn't a real play. No player choice of which gear on either side. playCardIgnoringCost also
 * ignores Power cost, unlike the printed text (see soulgorger.ts for the same simplification).
 */
export const jayceManOfProgress: SpecialCaseHandler = {
  cardId: "jayce-man-of-progress",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const player = ctx.game.players[controller];
    const handIdx = player.hand.findIndex((id) => {
      const card = getCard(id);
      return card.type === "gear" && card.energyCost !== null && card.energyCost <= MAX_ENERGY_COST;
    });
    if (handIdx === -1) return;
    const gearToKill = Object.values(ctx.game.instances).find(
      (i) => i.controller === controller && i.instanceId !== ctx.instance.instanceId && getCard(i.cardId).type === "gear",
    );
    if (!gearToKill) return;
    destroyInstance(ctx.game, getCard, gearToKill.instanceId);
    const [chosen] = player.hand.splice(handIdx, 1);
    playCardIgnoringCost(ctx.game, controller, chosen);
  },
};
