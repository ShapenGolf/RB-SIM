import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";
import { dealMutualMightDamage } from "./mutual-damage-helpers";

/**
 * As you play this, you may pay Body Rune as an additional cost. Choose a friendly unit and an
 * enemy unit. If you paid the additional cost, give the friendly unit +2 Might this turn. They
 * deal damage equal to their Mights to each other.
 *
 * Simplification: the optional Body-Rune additional cost isn't wired up (same accepted gap as
 * other Domain-Rune-only additional costs — see docs/data-sourcing.md); this covers the
 * baseline duel. No player choice of which two units — strongest friendly vs. weakest enemy,
 * anywhere on the board.
 */
export const rampage: SpecialCaseHandler = {
  cardId: "rampage",
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
