import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 4;

/**
 * [Reaction] Choose a friendly unit that's in combat with an enemy Fury (Fury Rune) unit or
 * that's being chosen by an enemy Fury spell. Give it +4 Might this turn.
 *
 * Reaction timing and "being chosen by an enemy spell" aren't modeled. Simplification: "in
 * combat with an enemy Fury unit" is approximated as "at the same battlefield as an enemy Fury
 * unit" (see docs/data-sourcing.md) — picks the first friendly unit meeting that condition.
 */
export const decreeOfFocus: SpecialCaseHandler = {
  cardId: "decree-of-focus",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const enemyId = controller === "0" ? "1" : "0";
    for (const slot of ctx.game.battlefields) {
      const hasEnemyFury = slot.units[enemyId].some((id) => {
        const instance = ctx.game.instances[id];
        return instance && getCard(instance.cardId).domains.includes("Fury");
      });
      if (!hasEnemyFury) continue;
      const friendlyId = slot.units[controller][0];
      if (!friendlyId) continue;
      const friendly = ctx.game.instances[friendlyId];
      if (friendly) friendly.tempMightBonus += MIGHT_BONUS;
      return;
    }
  },
};
