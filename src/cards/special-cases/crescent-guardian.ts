import type { SpecialCaseHandler } from "./types";

/**
 * If you've played a spell this turn, you may pay Chaos Rune as an additional cost to play me.
 * If you do, I enter ready.
 *
 * Simplification: the Domain-Rune part of the additional cost is not charged (same precedent as
 * the Accelerate keyword — see cards/special-cases/types.ts `additionalPlayCostEnergy`).
 */
export const crescentGuardian: SpecialCaseHandler = {
  cardId: "crescent-guardian",
  additionalPlayCostEnergy: () => 0,
  selfEntersReady: (ctx) =>
    Boolean(ctx.game.players[ctx.instance.controller].playedSpellThisTurn) &&
    Boolean(ctx.instance.statuses.paidAdditionalCostThisTurn),
};
