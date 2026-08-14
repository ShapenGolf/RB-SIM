import type { SpecialCaseHandler } from "./types";

const TARGET_UNIT_COUNT = 2;
const REDUCTION = 2;

/**
 * I cost 2 Energy+Order Rune less if you control a battlefield with exactly two units there.
 * Simplification: only the Energy component of the reduction is modeled, matching the existing
 * Energy+Rune cost-reduction handling elsewhere (see cards/special-cases/eager-apprentice.ts).
 */
export const keeperOfLaw: SpecialCaseHandler = {
  cardId: "keeper-of-law",
  costReduction: (ctx) => {
    const hasQualifyingBattlefield = ctx.game.battlefields.some(
      (slot) => slot.controller === ctx.instance.controller && slot.units["0"].length + slot.units["1"].length === TARGET_UNIT_COUNT,
    );
    if (!hasQualifyingBattlefield) return 0;
    return Math.min(REDUCTION, ctx.card.energyCost ?? 0);
  },
};
