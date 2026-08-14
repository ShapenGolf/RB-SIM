import type { SpecialCaseHandler } from "./types";

/** [Deflect] [Tank] I don't deal combat damage. */
export const galioIndefatigable: SpecialCaseHandler = {
  cardId: "galio-indefatigable",
  preventsCombatDamage: () => true,
};
