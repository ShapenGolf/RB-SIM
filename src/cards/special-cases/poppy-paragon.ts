import type { SpecialCaseContext, SpecialCaseHandler } from "./types";

const XP_GAIN = 3;
const SCORE_THRESHOLD = 3;
// Matches turnFlow.ts's WIN_SCORE constant; duplicated here (rather than imported) to avoid a
// game/turnFlow.ts <-> cards/special-cases/registry.ts import cycle. Ignores any Battlefield
// win-score-increase modifiers (see SpecialCaseEngine.winScoreBonus) — a documented simplification.
const BASE_WIN_SCORE = 8;

function opponentNearVictory(ctx: SpecialCaseContext): boolean {
  const opponentId = ctx.instance.controller === "0" ? "1" : "0";
  return ctx.game.players[opponentId].points >= BASE_WIN_SCORE - SCORE_THRESHOLD;
}

/** [Deflect] When you play me, if an opponent's score is within 3 points of the Victory Score, ready me and gain 3 XP. */
export const poppyParagon: SpecialCaseHandler = {
  cardId: "poppy-paragon",
  selfEntersReady: (ctx) => opponentNearVictory(ctx),
  onPlay: (ctx) => {
    if (!opponentNearVictory(ctx)) return;
    ctx.game.players[ctx.instance.controller].xp += XP_GAIN;
  },
};
