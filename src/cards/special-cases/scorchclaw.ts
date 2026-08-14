import type { SpecialCaseHandler } from "./types";

const LEVEL_THRESHOLD = 3;

/** [Hunt 2] [Level 3] I have +1 Might and enter ready. */
export const scorchclaw: SpecialCaseHandler = {
  cardId: "scorchclaw",
  staticMightModifier: (ctx) =>
    ctx.game.players[ctx.instance.controller].xp >= LEVEL_THRESHOLD ? 1 : 0,
  selfEntersReady: (ctx) => ctx.game.players[ctx.instance.controller].xp >= LEVEL_THRESHOLD,
};
