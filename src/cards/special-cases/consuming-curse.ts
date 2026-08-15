import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Action] Deal 2 to a unit at a battlefield. This deals 1 Bonus Damage for each card with this
 * name in your trash.
 *
 * Simplification: no player choice of target (see docs/data-sourcing.md) — hits the weakest
 * enemy unit at any battlefield (best chance to kill), anywhere.
 */
export const consumingCurse: SpecialCaseHandler = {
  cardId: "consuming-curse",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let target: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!target || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, target, "none")) {
        target = instance;
      }
    }
    if (!target) return;
    const player = ctx.game.players[ctx.instance.controller];
    const bonus = player.trash.filter((id) => id === ctx.instance.cardId).length;
    dealSpellDamage(ctx.game, getCard, target.instanceId, 2 + bonus, ctx.instance.controller);
  },
};
