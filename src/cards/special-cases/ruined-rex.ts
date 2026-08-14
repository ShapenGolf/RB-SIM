import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * [Deathknell] — Deal 4 to an enemy unit.
 *
 * Simplification: no player choice of which enemy (see docs/data-sourcing.md) — hits the first
 * one found anywhere.
 */
export const ruinedRex: SpecialCaseHandler = {
  cardId: "ruined-rex",
  onDestroy: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== opponentId) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (!target) return;
    dealSpellDamage(ctx.game, getCard, target.instanceId, 4, ctx.instance.controller);
  },
};
