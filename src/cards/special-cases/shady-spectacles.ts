import type { SpecialCaseHandler } from "./types";

/**
 * [Equip] 1 EnergyOrder Rune (1 EnergyOrder Rune: Attach this to a unit you control.)
 * As this is attached to a unit, choose another friendly unit. The equipped unit becomes a copy
 * of that unit for as long as this is attached to it.
 *
 * [Equip] itself is generic (game/equip.ts attachEquipment) and works fine on its own — this
 * registration exists only to document that "becomes a copy of that unit" ability-copying isn't
 * modeled (deferred, see heimerdinger-inventor.ts's identical note).
 */
export const shadySpectacles: SpecialCaseHandler = {
  cardId: "shady-spectacles",
};
