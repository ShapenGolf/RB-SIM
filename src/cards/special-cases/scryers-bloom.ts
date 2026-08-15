import type { SpecialCaseHandler } from "./types";

/**
 * This enters exhausted. Kill this, 1 Energy, Exhaust: [Predict 2], then draw 1. Gain 1 XP.
 *
 * "This enters exhausted" needs no bespoke code — every new instance already enters exhausted by
 * default (see game/setup.ts createInstance). [Predict 2] is approximated as a single Predict
 * (the generic pendingPredict flag only models looking at 1 card — see game/moves.ts
 * resolvePredict), a documented gap matching eclipse.ts's precedent.
 */
export const scryersBloom: SpecialCaseHandler = {
  cardId: "scryers-bloom",
  activatedAbilityCost: { energy: 1, exhaustSelf: true, killSelf: true },
  onActivate: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    player.pendingPredict = true;
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
    player.xp += 1;
  },
};
