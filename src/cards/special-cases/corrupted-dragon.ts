import type { SpecialCaseHandler } from "./types";
import { WIN_SCORE } from "../../game/turnFlow";
import { SpecialCaseEngine } from "./registry";
import { getCard } from "../db";

const PROXIMITY = 3;

/**
 * If your score is not within 3 points of the Victory Score, I enter ready.
 * When I attack, you may move any number of enemy units here each with 5 Might or less to their
 * base. Simplification: only the first clause (a conditional self-ready check) is modeled — the
 * "move any number of enemy units" clause needs multi-target selection the engine doesn't have
 * yet (see docs/data-sourcing.md).
 */
export const corruptedDragon: SpecialCaseHandler = {
  cardId: "corrupted-dragon",
  selfEntersReady: (ctx) => {
    const score = ctx.game.players[ctx.instance.controller].points;
    const winScore = WIN_SCORE + SpecialCaseEngine.winScoreBonus(ctx.game, getCard);
    return Math.abs(score - winScore) > PROXIMITY;
  },
};
