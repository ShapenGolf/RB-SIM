import type { SpecialCaseHandler } from "./types";

/**
 * You ignore [Tank] while assigning combat damage here.
 *
 * Uses the new ignoresTankHere hook (game/combat.ts orderForDamageAssignment via
 * registry.ts ignoresTankHere) — checked against every unit at a battlefield, not just the
 * Battlefield card itself, so a unit's own presence is enough to disable Tank-first ordering
 * there for both sides.
 */
export const duneSurfer: SpecialCaseHandler = {
  cardId: "dune-surfer",
  ignoresTankHere: () => true,
};
