import type { SpecialCaseHandler } from "./types";

/** My Might is increased by your points. */
export const dravenShowboat: SpecialCaseHandler = {
  cardId: "draven-showboat",
  staticMightModifier: (ctx) => ctx.game.players[ctx.instance.controller].points,
};
