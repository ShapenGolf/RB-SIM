import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 4;

/**
 * Discard a gear, 1 Energy, Exhaust: Deal 4 to a unit at a battlefield.
 *
 * Simplification: the discard cost isn't filtered to gear cards specifically — discards
 * whatever's at the front of hand, same as every other discard-cost card in this engine (see
 * docs/data-sourcing.md); the move is still blocked if hand is empty. No player choice of
 * target — hits the strongest enemy unit at a battlefield this would kill, or the weakest if
 * none would die.
 */
export const skyCruiser: SpecialCaseHandler = {
  cardId: "sky-cruiser",
  activatedAbilityCost: { energy: 1, exhaustSelf: true, discardCount: 1 },
  onActivate: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let bestKill: CardInstance | undefined;
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
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
