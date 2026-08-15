import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";
import { dealMutualMightDamage } from "./mutual-damage-helpers";

/**
 * [Action] Choose a friendly unit and an enemy unit. They deal damage equal to their Mights to
 * each other.
 *
 * Simplification: no player choice of which two units (see docs/data-sourcing.md) — always
 * picks the controller's strongest unit (best chance to survive/win the trade) against the
 * opponent's weakest unit (most likely kill), anywhere on the board.
 */
export const challenge: SpecialCaseHandler = {
  cardId: "challenge",
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
