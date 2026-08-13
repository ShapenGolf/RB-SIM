import type { SpecialCaseHandler } from "./types";
import { returnUnitFromTrashToHand } from "./trash-recursion";

/**
 * When you play me, return a unit from your trash to your hand.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — returns the
 * first unit found in trash.
 */
export const cemeteryAttendant: SpecialCaseHandler = {
  cardId: "cemetery-attendant",
  onPlay: (ctx) => {
    returnUnitFromTrashToHand(ctx.game, ctx.instance.controller);
  },
};
