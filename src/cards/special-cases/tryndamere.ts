import type { SpecialCaseHandler } from "./types";

/** When I conquer after an attack, if you assigned 5 or more excess damage to enemy units, you score 1 point. */
export const tryndamere: SpecialCaseHandler = {
  cardId: "tryndamere",
  onConquer: (ctx, excessDamage) => {
    if (excessDamage >= 5) ctx.game.players[ctx.instance.controller].points += 1;
  },
};
