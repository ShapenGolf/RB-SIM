import type { SpecialCaseHandler } from "./types";

const LEVEL_THRESHOLD = 11;

/** [Level 11] I have +4 Might. */
export const targonianVisionary: SpecialCaseHandler = {
  cardId: "targonian-visionary",
  staticMightModifier: (ctx) =>
    ctx.game.players[ctx.instance.controller].xp >= LEVEL_THRESHOLD ? 4 : 0,
};
