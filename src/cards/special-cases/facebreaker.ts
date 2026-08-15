import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] [Action] Stun a friendly unit and an enemy unit at the same battlefield.
 *
 * [Hidden]'s face-down timing isn't modeled — resolves immediately. Simplification: no player
 * choice of which battlefield/units (see docs/data-sourcing.md) — picks the first battlefield
 * with both a friendly and an enemy unit present.
 */
export const facebreaker: SpecialCaseHandler = {
  cardId: "facebreaker",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const enemyId = controller === "0" ? "1" : "0";
    for (const slot of ctx.game.battlefields) {
      const friendlyId = slot.units[controller][0];
      const enemyUnitId = slot.units[enemyId][0];
      if (!friendlyId || !enemyUnitId) continue;
      const friendly = ctx.game.instances[friendlyId];
      const enemy = ctx.game.instances[enemyUnitId];
      if (friendly) friendly.statuses.stunned = true;
      if (enemy) enemy.statuses.stunned = true;
      return;
    }
  },
};
