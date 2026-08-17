import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 2;

/**
 * When you hide a card, ready me.
 * When you play a card from face down, deal 2 to an enemy unit.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — targets the
 * strongest enemy unit, matching this codebase's established precedent for untargeted "deal
 * damage to a unit" effects (e.g. back-off.ts, sudden-storm.ts).
 */
export const katarinaReckless: SpecialCaseHandler = {
  cardId: "katarina-reckless",
  onAllyHideCard: (ctx) => {
    ctx.instance.exhausted = false;
  },
  onAllyPlayFromHidden: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let strongest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!strongest || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, strongest, "none")) {
        strongest = instance;
      }
    }
    if (strongest) dealSpellDamage(ctx.game, getCard, strongest.instanceId, DAMAGE, ctx.instance.controller);
  },
};
