import type { SpecialCaseHandler } from "./types";

/**
 * [Accelerate] (You may pay 1 EnergyMind Rune as an additional cost to have me enter ready.)
 * Each Equipment attached to me gives double its base Might bonus.
 *
 * [Accelerate] is a printed keyword, already generic. The doubling clause is moot but genuinely
 * has no observable effect regardless: every imported Equipment card's own `might` field is
 * null/0 (see game/might.ts's equipmentBonus comment) — doubling zero is still zero.
 */
export const gearhead: SpecialCaseHandler = {
  cardId: "gearhead",
};
