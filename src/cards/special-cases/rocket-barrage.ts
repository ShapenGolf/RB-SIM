import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 4;

/**
 * Choose one — Deal 4 to a unit in a base. Kill a gear.
 * Repeat (pay 4 EnergyMind Rune to repeat, possibly with different choices) isn't wired up yet
 * — see docs/data-sourcing.md; this covers the card's baseline single effect.
 *
 * Simplification: no player choice of mode — prefers killing an enemy gear (removes a
 * permanent asset outright) if one exists, otherwise deals 4 to the strongest enemy unit in
 * base it would kill (or the weakest if none would die).
 */
export const rocketBarrage: SpecialCaseHandler = {
  cardId: "rocket-barrage",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const enemyGear = Object.values(ctx.game.instances).find(
      (i) => i.controller === enemyId && getCard(i.cardId).type === "gear",
    );
    if (enemyGear) {
      destroyInstance(ctx.game, getCard, enemyGear.instanceId);
      return;
    }

    let bestKill: CardInstance | undefined;
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "base") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      const might = computeMight(ctx.game, getCard, instance, "none");
      if (might <= DAMAGE && (!bestKill || might > computeMight(ctx.game, getCard, bestKill, "none"))) {
        bestKill = instance;
      }
      if (!weakest || might < computeMight(ctx.game, getCard, weakest, "none")) weakest = instance;
    }
    const target = bestKill ?? weakest;
    if (target) dealSpellDamage(ctx.game, getCard, target.instanceId, DAMAGE, ctx.instance.controller);
  },
};
