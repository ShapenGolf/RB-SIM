import { getCard } from "../db";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const MIGHT_DELTA = 2;

/**
 * [Reaction] Give a unit +2 Might this turn and another unit -2 Might this turn.
 *
 * Reaction timing isn't modeled — resolves immediately. Simplification: no player choice (see
 * docs/data-sourcing.md) — buffs the controller's own unit, debuffs an enemy unit.
 */
export const defiantDance: SpecialCaseHandler = {
  cardId: "defiant-dance",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const friendly = Object.values(ctx.game.instances).find(
      (i) => i.controller === ctx.instance.controller && isUnitOrChampion(i),
    );
    if (friendly) friendly.tempMightBonus += MIGHT_DELTA;
    const enemy = Object.values(ctx.game.instances).find((i) => i.controller === enemyId && isUnitOrChampion(i));
    if (enemy) enemy.tempMightBonus -= MIGHT_DELTA;
  },
};

function isUnitOrChampion(instance: CardInstance): boolean {
  const t = getCard(instance.cardId).type;
  return t === "unit" || t === "champion";
}
