import type { SpecialCaseHandler } from "./types";

const RUNE_THRESHOLD = 2;
const MIGHT_BONUS = 2;

/**
 * [Accelerate] (You may pay 1 EnergyChaos Rune as an additional cost to have me enter ready.)
 * If you've spent at least 2 Rune this turn, I have +2 Might and [Ganking].
 *
 * Uses PlayerState.runesSpentThisTurn (see game/templatedEffectEngine.ts's recycleRune, the
 * chokepoint for every rune-recycle site) — checked live via staticMightModifier/
 * hasConditionalGanking, same pattern as wily-newtfish.ts's gainedXPThisTurn check.
 */
export const sivirMercenary: SpecialCaseHandler = {
  cardId: "sivir-mercenary",
  staticMightModifier: (ctx) =>
    ctx.game.players[ctx.instance.controller].runesSpentThisTurn >= RUNE_THRESHOLD ? MIGHT_BONUS : 0,
  hasConditionalGanking: (ctx) => ctx.game.players[ctx.instance.controller].runesSpentThisTurn >= RUNE_THRESHOLD,
};
