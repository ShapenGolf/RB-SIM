import type { SpecialCaseHandler } from "./types";

/**
 * When a unit here is returned to a player's hand, that player may pay 1 Energy to channel 1
 * rune exhausted.
 *
 * Simplification: the 1-Energy cost isn't charged (established precedent, see treasure-hoard.ts).
 * Uses the new onUnitReturnedToHandHere broadcast — see bounce-helpers.ts returnInstanceToHand.
 */
export const rippersBay: SpecialCaseHandler = {
  cardId: "rippers-bay",
  onUnitReturnedToHandHere: (ctx, returnedInstance) => {
    const player = ctx.game.players[returnedInstance.controller];
    const rune = player.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      player.runePool.push(rune);
    }
  },
};
