import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";
import { moveInstanceToBase } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 2;

/**
 * Deal 2 to up to one enemy unit at a battlefield, then move a friendly unit. [Flow] 3
 * Energy Rune (You may play this from your trash for its Flow cost. Then banish it.)
 *
 * [Flow] is now wired generically (see game/moves.ts playFromTrash, cards/db.ts parseFlowCost) —
 * this handler's onPlay is reused verbatim whether played from hand or from trash via Flow.
 * Simplification: no stated destination for "move a friendly unit" = send to base (established
 * precedent, see charm.ts). No player choice of which units — picks the first ones found.
 */
export const shurikenFlip: SpecialCaseHandler = {
  cardId: "shuriken-flip",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const enemyUnit = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId || i.zone !== "battlefield") return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (enemyUnit) dealSpellDamage(ctx.game, getCard, enemyUnit.instanceId, DAMAGE, ctx.instance.controller);

    const friendlyUnit = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (friendlyUnit) moveInstanceToBase(ctx.game, getCard, friendlyUnit.instanceId);
  },
};
