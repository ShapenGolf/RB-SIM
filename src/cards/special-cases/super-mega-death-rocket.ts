import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 5;

/**
 * Deal 5 to a unit.
 * When you conquer, you may discard 1 to return this from your trash to your hand.
 *
 * Known gap: the "return this from trash when you conquer" ability isn't modeled — this
 * engine's onConquer broadcast only reaches in-play instances, not trashed cards (see
 * docs/data-sourcing.md); only the primary damage effect is implemented.
 * Simplification: no player choice of target — hits the strongest enemy unit this would kill
 * (Might <= 5), anywhere; if none would die, hits the weakest enemy unit instead.
 */
export const superMegaDeathRocket: SpecialCaseHandler = {
  cardId: "super-mega-death-rocket",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let bestKill: CardInstance | undefined;
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      const might = computeMight(ctx.game, getCard, instance, "none");
      if (might <= DAMAGE && (!bestKill || might > computeMight(ctx.game, getCard, bestKill, "none"))) {
        bestKill = instance;
      }
      if (!weakest || might < computeMight(ctx.game, getCard, weakest, "none")) weakest = instance;
    }
    const target = bestKill ?? weakest;
    if (!target) return;
    dealSpellDamage(ctx.game, getCard, target.instanceId, DAMAGE, ctx.instance.controller);
  },
};
