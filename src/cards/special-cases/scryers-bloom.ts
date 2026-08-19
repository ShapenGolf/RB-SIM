import type { SpecialCaseHandler } from "./types";
import { gainXP } from "../../game/templatedEffectEngine";

/**
 * This enters exhausted. Kill this, 1 Energy, Exhaust: [Predict 2], then draw 1. Gain 1 XP.
 *
 * "This enters exhausted" needs no bespoke code — every new instance already enters exhausted by
 * default (see game/setup.ts createInstance).
 */
export const scryersBloom: SpecialCaseHandler = {
  cardId: "scryers-bloom",
  activatedAbilityCost: { energy: 1, exhaustSelf: true, killSelf: true },
  onActivate: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    player.pendingPredict = 2;
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
    gainXP(player, 1);
  },
};
