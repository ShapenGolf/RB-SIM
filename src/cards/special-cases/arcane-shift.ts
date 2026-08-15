import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import { banishInstance } from "./banish-helpers";
import { playCardIgnoringCost } from "../../game/playFree";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 3;

/**
 * [Action] Banish a friendly unit, then its owner plays it, ignoring its cost. Deal 3 to an
 * enemy unit at a battlefield. Banish this.
 *
 * Simplification: no player choice — banishes and redeploys the controller's weakest friendly
 * unit (cheapest to lose board presence on), hits the weakest enemy unit at a battlefield.
 */
export const arcaneShift: SpecialCaseHandler = {
  cardId: "arcane-shift",
  banishSelfOnResolve: () => true,
  onPlay: (ctx) => {
    let weakestFriendly: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!weakestFriendly || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, weakestFriendly, "none")) {
        weakestFriendly = instance;
      }
    }
    if (weakestFriendly) {
      const controller = weakestFriendly.controller;
      const cardId = weakestFriendly.cardId;
      banishInstance(ctx.game, weakestFriendly);
      const player = ctx.game.players[controller];
      const idx = player.banishment.lastIndexOf(cardId);
      if (idx !== -1) player.banishment.splice(idx, 1);
      playCardIgnoringCost(ctx.game, controller, cardId);
    }

    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let weakestEnemy: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!weakestEnemy || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, weakestEnemy, "none")) {
        weakestEnemy = instance;
      }
    }
    if (weakestEnemy) dealSpellDamage(ctx.game, getCard, weakestEnemy.instanceId, DAMAGE, ctx.instance.controller);
  },
};
