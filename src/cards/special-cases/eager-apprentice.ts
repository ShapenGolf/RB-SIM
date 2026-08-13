import type { SpecialCaseHandler } from "./types";

/**
 * While I'm at a battlefield, the Energy costs for spells you play is reduced by 1 Energy,
 * to a minimum of 1 Energy.
 *
 * Simplification: the "to a minimum of 1" floor isn't separately modeled (the generic cost
 * floor in moves.ts is 0, not 1) — see docs/data-sourcing.md known simplifications.
 */
export const eagerApprentice: SpecialCaseHandler = {
  cardId: "eager-apprentice",
  costReductionForAlly: (ctx, playedCard) => {
    if (ctx.instance.zone !== "battlefield") return 0;
    return playedCard.type === "spell" ? 1 : 0;
  },
};
