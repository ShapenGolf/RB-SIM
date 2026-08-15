import type { SpecialCaseHandler } from "./types";

/**
 * Your Mechs have [Vision]. (When you play us, look at the top card of your Main Deck. You may
 * recycle it.)
 *
 * Grants the generic Vision keyword's effect (pendingPredict) to friendly Mechs when played,
 * matching keywords/handlers/vision.ts's own onPlay behavior.
 */
export const forecaster: SpecialCaseHandler = {
  cardId: "forecaster",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (!(playedCard.tags ?? []).includes("Mech")) return;
    ctx.game.players[ctx.instance.controller].pendingPredict = true;
  },
};
