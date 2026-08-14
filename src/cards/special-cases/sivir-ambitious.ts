import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

const THRESHOLD = 5;

/**
 * [Deflect 2] When I conquer after an attack, if you assigned 5 or more excess damage to enemy
 * units, you may deal that much to an enemy unit.
 *
 * Simplification: no player choice of which enemy unit (see docs/data-sourcing.md) — hits the
 * first one found anywhere. The "may" auto-resolves to taking the damage.
 */
export const sivirAmbitious: SpecialCaseHandler = {
  cardId: "sivir-ambitious",
  onConquer: (ctx, excessDamage) => {
    if (excessDamage < THRESHOLD) return;
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== opponentId) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (!target) return;
    dealSpellDamage(ctx.game, getCard, target.instanceId, excessDamage, ctx.instance.controller);
  },
};
