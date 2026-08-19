import type { SpecialCaseHandler } from "./types";

const THRESHOLD = 4;

/**
 * While you control this battlefield, when you play a spell, if you spent 4 Energy or more,
 * [Predict]. (Look at the top card of your Main Deck. You may recycle it.)
 *
 * "You control this battlefield" uses BattlefieldSlot.controller (registry.ts onAllyCardPlayed
 * now also broadcasts to the controlling player's Battlefield pseudo-instance — see the
 * game.battlefields.forEach block added alongside this card). "Spent 4 Energy or more" reuses
 * the existing maxEnergySpentOnSpellThisTurn simplification (prepared-neophyte.ts precedent) —
 * it's already updated by the time this fires, since moves.ts sets it before calling
 * resolvePlayedCard.
 */
export const forgottenLibrary: SpecialCaseHandler = {
  cardId: "forgotten-library",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type !== "spell") return;
    const player = ctx.game.players[ctx.instance.controller];
    if (player.maxEnergySpentOnSpellThisTurn < THRESHOLD) return;
    player.pendingPredict = 1;
  },
};
