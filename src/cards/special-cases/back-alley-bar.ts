import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 1;

/**
 * When a unit moves from here, give it +1 Might this turn.
 *
 * Reuses onMoveFromBattlefield, now also broadcast to the Battlefield's own card with the mover
 * passed as `moverInstance` (see registry.ts) — "a unit moves from here" is exactly this hook.
 */
export const backAlleyBar: SpecialCaseHandler = {
  cardId: "back-alley-bar",
  onMoveFromBattlefield: (_ctx, _fromBattlefieldIndex, moverInstance) => {
    if (moverInstance) moverInstance.tempMightBonus += MIGHT_BONUS;
  },
};
