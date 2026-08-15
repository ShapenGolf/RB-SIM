import type { SpecialCaseHandler } from "./types";

/**
 * [Vision] (generic keyword, already wired.)
 * When I conquer, if you've played a non-token unit, a non-token gear, and a spell this turn,
 * you score 1 point.
 */
export const swainVisionary: SpecialCaseHandler = {
  cardId: "swain-visionary",
  onConquer: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player.playedNonTokenUnitThisTurn && player.playedNonTokenGearThisTurn && player.playedSpellThisTurn) {
      player.points += 1;
    }
  },
};
