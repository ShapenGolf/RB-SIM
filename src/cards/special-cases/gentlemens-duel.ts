import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";
import { dealMutualMightDamage } from "./mutual-damage-helpers";

/**
 * [Action] Give a friendly unit +3 Might this turn. Then choose an enemy unit. They deal
 * damage equal to their Mights to each other.
 *
 * Simplification: no player choice of which two units (see docs/data-sourcing.md) — buffs the
 * controller's strongest unit (the buff resolves before the duel, so it's included in the Might
 * comparison), then duels it against the opponent's weakest unit, anywhere on the board.
 */
export const gentlemensDuel: SpecialCaseHandler = {
  cardId: "gentlemens-duel",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let friendly: CardInstance | undefined;
    let enemy: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      const card = getCard(instance.cardId);
      if (card.type !== "unit" && card.type !== "champion") continue;
      const m = computeMight(ctx.game, getCard, instance, "none");
      if (instance.controller === ctx.instance.controller) {
        if (!friendly || m > computeMight(ctx.game, getCard, friendly, "none")) friendly = instance;
      } else if (instance.controller === enemyId) {
        if (!enemy || m < computeMight(ctx.game, getCard, enemy, "none")) enemy = instance;
      }
    }
    if (!friendly) return;
    friendly.tempMightBonus += 3;
    if (!enemy) return;
    dealMutualMightDamage(ctx.game, friendly, enemy);
  },
};
