import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";
import { dealMutualMightDamage } from "./mutual-damage-helpers";

/**
 * Choose two units. They deal damage equal to their Mights to each other.
 *
 * Simplification: no player choice of targets — duels the controller's strongest unit against
 * the opponent's weakest unit, anywhere on the board (see docs/data-sourcing.md).
 */
export const clashOfGiants: SpecialCaseHandler = {
  cardId: "clash-of-giants",
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
    if (!friendly || !enemy) return;
    dealMutualMightDamage(ctx.game, friendly, enemy);
  },
};
