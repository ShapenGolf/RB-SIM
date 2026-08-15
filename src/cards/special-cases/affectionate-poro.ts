import type { SpecialCaseHandler } from "./types";

/**
 * When a combat that I was in ends, if I haven't been dealt damage this turn, draw 1.
 * `onSurviveCombat` fires exactly on "a real Showdown this instance was in just ended and it's
 * still alive" — not for an unopposed conquest (no Showdown took place), matching "a combat that
 * I was in" precisely (see cards/special-cases/types.ts).
 */
export const affectionatePoro: SpecialCaseHandler = {
  cardId: "affectionate-poro",
  onSurviveCombat: (ctx) => {
    if (ctx.instance.statuses.tookDamageThisTurn) return;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
