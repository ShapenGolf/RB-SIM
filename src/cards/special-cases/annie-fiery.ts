import type { SpecialCaseHandler } from "./types";

/** Your spells and abilities deal 1 Bonus Damage. */
export const annieFiery: SpecialCaseHandler = {
  cardId: "annie-fiery",
  staticSpellDamageBonus: () => 1,
};
