import { getCard } from "../db";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 1;

/**
 * Move an enemy unit to a battlefield where you have units. If you have exactly two units there,
 * they each get +1 Might this turn. [Flow] 5 Energy Rune Rune (You may play this from your trash
 * for its Flow cost. Then banish it.)
 *
 * [Flow] is now wired generically (see game/moves.ts playFromTrash, cards/db.ts parseFlowCost) —
 * this handler's onPlay is reused verbatim whether played from hand or from trash via Flow.
 * Simplification: no player choice of which enemy unit/battlefield — picks the first battlefield
 * with friendly units and the first enemy unit found.
 */
export const shadowDash: SpecialCaseHandler = {
  cardId: "shadow-dash",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const enemyId = controller === "0" ? "1" : "0";
    const index = ctx.game.battlefields.findIndex((slot) => slot.units[controller].length > 0);
    if (index === -1) return;
    const enemyUnit = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!enemyUnit) return;
    moveInstanceToBattlefield(ctx.game, enemyUnit.instanceId, index);

    const slot = ctx.game.battlefields[index];
    if (slot.units[controller].length === 2) {
      for (const id of slot.units[controller]) {
        const instance = ctx.game.instances[id];
        if (instance) instance.tempMightBonus += MIGHT_BONUS;
      }
    }
  },
};
