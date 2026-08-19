import type { SpecialCaseHandler } from "./types";

/**
 * [Equip] 1 EnergyOrder Rune (1 EnergyOrder Rune: Attach this to a unit you control.)
 * As this is attached to a unit, choose another friendly unit. The equipped unit becomes a copy
 * of that unit for as long as this is attached to it.
 *
 * [Equip] itself is generic (game/equip.ts attachEquipment) and works fine on its own — this
 * registration exists only to document that "becomes a copy of that unit" ability-copying isn't
 * modeled. This is a genuinely bigger gap than it looks: the equipped unit is an EXISTING
 * instance (its own damage, buffs, other Equipment) adopting another card's full ability set —
 * not something a fresh same-cardId instance (the trick used by mirror-image.ts/deceiver.ts for
 * "play a copy AS A NEW TOKEN") can express. See heimerdinger-inventor.ts's doc comment for why a
 * real fix needs an "effective card" override respected at every getCard(instance.cardId) call
 * site across the engine, not a bounded chokepoint.
 */
export const shadySpectacles: SpecialCaseHandler = {
  cardId: "shady-spectacles",
};
