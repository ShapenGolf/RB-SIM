import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Ambush] (generic keyword, already wired.)
 * When you play me, deal damage to a unit equal to the damage marked on it.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — targets the most
 * heavily damaged unit anywhere, for the biggest guaranteed impact (potentially a kill).
 */
export const morganaVindictive: SpecialCaseHandler = {
  cardId: "morgana-vindictive",
  onPlay: (ctx) => {
    let mostDamaged: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.damage <= 0) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!mostDamaged || instance.damage > mostDamaged.damage) mostDamaged = instance;
    }
    if (!mostDamaged) return;
    dealSpellDamage(ctx.game, getCard, mostDamaged.instanceId, mostDamaged.damage, ctx.instance.controller);
  },
};
