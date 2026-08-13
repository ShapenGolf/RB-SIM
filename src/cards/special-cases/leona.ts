import type { SpecialCaseHandler } from "./types";
import { WIN_SCORE } from "../../game/turnFlow";

const NEAR_VICTORY_MARGIN = 3;
const STUN_DEBUFF = -8;

/**
 * If an opponent's score is within 3 points of the Victory Score, I enter ready.
 * Stunned enemy units here have -8 Might, to a minimum of 1 Might.
 *
 * Simplification: the "to a minimum of 1" floor isn't separately modeled — computeMight's
 * generic floor is 0, not 1, so in the rare case this debuff alone would drive a unit's total
 * to exactly 0 it shows 0 instead of 1 (see docs/data-sourcing.md known simplifications).
 */
export const leona: SpecialCaseHandler = {
  cardId: "leona",
  selfEntersReady: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    return ctx.game.players[opponentId].points >= WIN_SCORE - NEAR_VICTORY_MARGIN;
  },
  staticMightModifierForEnemy: (ctx, enemy) => {
    if (enemy.controller === ctx.instance.controller) return 0;
    if (!enemy.statuses.stunned) return 0;
    if (ctx.instance.battlefieldIndex === null) return 0;
    return enemy.battlefieldIndex === ctx.instance.battlefieldIndex ? STUN_DEBUFF : 0;
  },
};
