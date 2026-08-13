import type { SpecialCaseHandler } from "./types";

/**
 * Spells and abilities affecting units here each deal 1 Bonus Damage.
 *
 * Covers spell damage (game/spellDamage.ts `dealSpellDamage`, the shared chokepoint most
 * activated abilities also use); damage dealt via `dealDistributedDamage` isn't covered.
 */
export const voidGate: SpecialCaseHandler = {
  cardId: "void-gate",
  spellDamageBonusForUnitsHere: () => 1,
};
