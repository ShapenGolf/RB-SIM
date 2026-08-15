import type { SpecialCaseHandler } from "./types";

/**
 * [Deathknell][>] [Predict 2]. (When I die, look at the top two cards of your Main Deck. Recycle
 * any of them and put the rest back in any order.)
 *
 * [Predict 2] is approximated as a single Predict (the generic pendingPredict flag only models
 * looking at 1 card — see game/moves.ts resolvePredict), a documented gap matching eclipse.ts's
 * precedent for unmodeled Predict N.
 */
export const dramaticVisionary: SpecialCaseHandler = {
  cardId: "dramatic-visionary",
  onDestroy: (ctx) => {
    ctx.game.players[ctx.instance.controller].pendingPredict = true;
  },
};
