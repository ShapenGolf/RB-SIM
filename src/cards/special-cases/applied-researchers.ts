import type { SpecialCaseHandler } from "./types";

/**
 * [Empowered] Your spells cost 1 Energy+Rune less, to a minimum of 1 Energy.
 *
 * Simplification: only the Energy component is reduced (matching the project's established
 * equip/cost-reduction handling of Energy+Rune costs), and the "to a minimum of 1" floor isn't
 * separately modeled — see docs/data-sourcing.md and cards/special-cases/eager-apprentice.ts.
 */
export const appliedResearchers: SpecialCaseHandler = {
  cardId: "applied-researchers",
  costReductionForAlly: (ctx, playedCard) => {
    if (!ctx.instance.statuses.empowered) return 0;
    return playedCard.type === "spell" ? 1 : 0;
  },
};
