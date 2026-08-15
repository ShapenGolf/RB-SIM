import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 2;

/**
 * [Hidden] [Ganking] (Ganking is generic, already wired.)
 * You may pay Fury Rune as an additional cost to play me. When you play me, if you paid the
 * additional cost, ready me and give me +2 Might this turn.
 *
 * [Hidden]'s face-down timing isn't modeled. Simplification: the Domain-Rune additional cost is
 * never charged (established precedent, see crescent-guardian.ts).
 */
export const pykeDocksideButcher: SpecialCaseHandler = {
  cardId: "pyke-dockside-butcher",
  additionalPlayCostEnergy: () => 0,
  selfEntersReady: (ctx) => Boolean(ctx.instance.statuses.paidAdditionalCostThisTurn),
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    ctx.instance.tempMightBonus += MIGHT_BONUS;
  },
};
