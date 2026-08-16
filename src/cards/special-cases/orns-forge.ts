import type { SpecialCaseHandler } from "./types";

/**
 * While you control this battlefield, the first friendly non-token gear played each turn costs
 * 1 Energy less.
 *
 * "Non-token" and "first...each turn" are both implicit in the existing
 * player.playedNonTokenGearThisTurn flag: it's only set (in game/moves.ts resolvePlayedCard)
 * AFTER cost is paid, and only for the hand-paid playCard path that tokens never go through — so
 * checking it here, before this play sets it, is exactly "is this the first one this turn".
 */
export const ornsForge: SpecialCaseHandler = {
  cardId: "orns-forge",
  costReductionForAlly: (ctx, playedCard) => {
    if (playedCard.type !== "gear") return 0;
    return ctx.game.players[ctx.instance.controller].playedNonTokenGearThisTurn ? 0 : 1;
  },
};
