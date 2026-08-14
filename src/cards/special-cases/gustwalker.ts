import type { SpecialCaseHandler } from "./types";

const LEVEL_THRESHOLD = 3;

/** [Hunt 2] [Level 3] I have +1 Might and [Ganking]. */
export const gustwalker: SpecialCaseHandler = {
  cardId: "gustwalker",
  staticMightModifier: (ctx) =>
    ctx.game.players[ctx.instance.controller].xp >= LEVEL_THRESHOLD ? 1 : 0,
  hasConditionalGanking: (ctx) => ctx.game.players[ctx.instance.controller].xp >= LEVEL_THRESHOLD,
};
