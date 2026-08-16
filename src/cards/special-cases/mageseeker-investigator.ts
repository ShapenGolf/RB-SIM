import type { SpecialCaseHandler } from "./types";

/**
 * Opponents must pay Rune for each unit beyond the first to move multiple units to my battlefield
 * at the same time.
 *
 * Moot — an extra-Rune-to-target-style cost (like Deflect) that nothing in the engine's move
 * validation enforces; also, moves in this engine happen one unit at a time, with no "move
 * multiple units simultaneously" action to hook a cost onto (deferred, see
 * allay-eager-admirer.ts's identical Deflect-enforcement note). No fallback mode.
 */
export const mageseekerInvestigator: SpecialCaseHandler = {
  cardId: "mageseeker-investigator",
};
