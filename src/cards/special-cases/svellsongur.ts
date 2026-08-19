import type { SpecialCaseHandler } from "./types";

/**
 * [Equip] 1 EnergyCalm Rune (1 EnergyCalm Rune: Attach this to a unit you control.)
 * As this is attached to a unit, copy that unit's text to this Equipment's effect text for as
 * long as this is attached to it.
 *
 * [Equip] itself is generic (game/equip.ts attachEquipment) and works fine on its own — this
 * registration exists only to document that the "copy that unit's text" ability-copying clause
 * isn't modeled — same "effective card" gap as shady-spectacles.ts, just copying text onto the
 * Equipment itself rather than transforming the equipped unit. See heimerdinger-inventor.ts's
 * doc comment for why this needs an engine-wide override, not a bounded chokepoint.
 */
export const svellsongur: SpecialCaseHandler = {
  cardId: "svellsongur",
};
