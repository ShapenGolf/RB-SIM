import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const MIGHT_PER_ENEMY = 2;

/**
 * [Reaction] Give a friendly unit at a battlefield +2 Might this turn for each enemy unit there.
 *
 * Reaction timing isn't modeled — resolves immediately like every other bespoke Reaction card.
 * Simplification: no player choice of unit/battlefield (see docs/data-sourcing.md) — picks the
 * friendly unit at the battlefield with the most enemy units present.
 */
export const againstTheOdds: SpecialCaseHandler = {
  cardId: "against-the-odds",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const enemyId = controller === "0" ? "1" : "0";
    let bestIndex = -1;
    let bestFriendly: CardInstance | undefined;
    let bestEnemyCount = -1;
    ctx.game.battlefields.forEach((slot, index) => {
      if (slot.units[controller].length === 0) return;
      const enemyCount = slot.units[enemyId].length;
      if (enemyCount > bestEnemyCount) {
        bestEnemyCount = enemyCount;
        bestIndex = index;
        bestFriendly = ctx.game.instances[slot.units[controller][0]];
      }
    });
    if (bestIndex === -1 || !bestFriendly || bestEnemyCount <= 0) return;
    bestFriendly.tempMightBonus += MIGHT_PER_ENEMY * bestEnemyCount;
  },
};
