import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 1;

/**
 * If you've gained XP this turn, I have +1 Might and [Ganking]. (I can move from battlefield to
 * battlefield.)
 *
 * Uses PlayerState.gainedXPThisTurn (see game/templatedEffectEngine.ts's gainXP, the chokepoint
 * for every XP-gain site) — checked live via staticMightModifier/hasConditionalGanking rather
 * than snapshotting at a single point in time, since XP can be gained anywhere during the turn.
 */
export const wilyNewtfish: SpecialCaseHandler = {
  cardId: "wily-newtfish",
  staticMightModifier: (ctx) => (ctx.game.players[ctx.instance.controller].gainedXPThisTurn ? MIGHT_BONUS : 0),
  hasConditionalGanking: (ctx) => ctx.game.players[ctx.instance.controller].gainedXPThisTurn,
};
