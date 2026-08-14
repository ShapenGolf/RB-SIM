import type { SpecialCaseContext, SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 3;

/**
 * When I attack or defend, give one of your other units here +3 Might and [Tank] this turn.
 *
 * Simplification: no player choice of which other unit (see docs/data-sourcing.md) — picks the
 * first one found at the same battlefield.
 */
function buffAllyHere(ctx: SpecialCaseContext): void {
  if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
  const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
  const allyId = slot.units[ctx.instance.controller].find((id) => id !== ctx.instance.instanceId);
  if (!allyId) return;
  const ally = ctx.game.instances[allyId];
  if (!ally) return;
  ally.tempMightBonus += MIGHT_BONUS;
  ally.grantedThisTurn.push({ keyword: "tank" });
}

export const yuumiMagicalCat: SpecialCaseHandler = {
  cardId: "yuumi-magical-cat",
  onAttack: (ctx) => buffAllyHere(ctx),
  onDefend: (ctx) => buffAllyHere(ctx),
};
