import type { SpecialCaseHandler } from "./types";

/** When another friendly unit dies, gain 1 XP. */
export const viciousSnapjaws: SpecialCaseHandler = {
  cardId: "vicious-snapjaws",
  onAllyUnitDied: (ctx) => {
    ctx.game.players[ctx.instance.controller].xp += 1;
  },
};
