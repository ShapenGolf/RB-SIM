import type { SpecialCaseHandler } from "./types";

/** When you play me, the next spell you play this turn costs 5 Energy less. */
export const ragingFirebrand: SpecialCaseHandler = {
  cardId: "raging-firebrand",
  onPlay: (ctx) => {
    ctx.game.players[ctx.instance.controller].nextSpellCostReduction += 5;
  },
};
