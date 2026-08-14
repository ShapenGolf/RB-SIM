import type { SpecialCaseHandler } from "./types";

const LEVEL_THRESHOLD = 6;

/** [Hunt] [Level 6] I have +1 Might. */
export const gemhandHunter: SpecialCaseHandler = {
  cardId: "gemhand-hunter",
  staticMightModifier: (ctx) =>
    ctx.game.players[ctx.instance.controller].xp >= LEVEL_THRESHOLD ? 1 : 0,
};
