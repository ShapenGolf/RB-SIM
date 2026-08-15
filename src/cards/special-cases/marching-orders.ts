import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";
import { dealMutualMightDamage } from "./mutual-damage-helpers";

/**
 * [Action] Choose a friendly unit anywhere and an enemy unit at a battlefield. They deal damage
 * equal to their Mights to each other.
 * Repeat (pay 3 Energy to repeat this effect) isn't wired up yet — see docs/data-sourcing.md;
 * this covers the card's baseline single effect.
 *
 * Simplification: no player choice of which two units — picks the controller's strongest unit
 * anywhere against the opponent's weakest unit at a battlefield.
 */
export const marchingOrders: SpecialCaseHandler = {
  cardId: "marching-orders",
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
      } else if (instance.controller === enemyId && instance.zone === "battlefield") {
        if (!enemy || m < computeMight(ctx.game, getCard, enemy, "none")) enemy = instance;
      }
    }
    if (!friendly || !enemy) return;
    dealMutualMightDamage(ctx.game, friendly, enemy);
  },
};
