import { getCard } from "../db";
import { moveInstanceToBase } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When you defend here, you may move a friendly unit here to base.
 *
 * Reuses onEnemyAttackHere, now broadcast to the Battlefield's own card too (see registry.ts) —
 * "you defend here" is exactly "an enemy attacks a battlefield you control." Simplification: the
 * "may" always resolves yes (no real downside — see docs/data-sourcing.md). No player choice of
 * which unit — picks the first friendly unit found here.
 */
export const reaversRow: SpecialCaseHandler = {
  cardId: "reavers-row",
  onEnemyAttackHere: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const unitId = slot.units[ctx.instance.controller][0];
    if (unitId) moveInstanceToBase(ctx.game, getCard, unitId);
  },
};
