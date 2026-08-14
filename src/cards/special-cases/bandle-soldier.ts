import type { SpecialCaseHandler } from "./types";

const LEVEL_THRESHOLD = 3;

/** [Level 3] I enter ready. */
export const bandleSoldier: SpecialCaseHandler = {
  cardId: "bandle-soldier",
  selfEntersReady: (ctx) => ctx.game.players[ctx.instance.controller].xp >= LEVEL_THRESHOLD,
};
