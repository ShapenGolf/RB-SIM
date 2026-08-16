import type { SpecialCaseHandler } from "./types";

/**
 * [Equip] 1 EnergyMind Rune (1 EnergyMind Rune: Attach this to a unit you control.)
 * 3 EnergyMind Rune, Banish this: Play all units banished with this, ignoring their costs. (Use
 * only if unattached.)
 *
 * [Equip] itself is generic (game/equip.ts attachEquipment) and works fine on its own. This
 * card's printed text has no clause that ever puts a unit into "banished with this" state, so
 * the second ability would always have nothing to play regardless — nothing to implement here
 * beyond the generic Equip attach.
 */
export const theZeroDrive: SpecialCaseHandler = {
  cardId: "the-zero-drive",
};
