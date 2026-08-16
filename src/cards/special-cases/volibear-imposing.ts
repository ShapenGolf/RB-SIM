import type { SpecialCaseHandler } from "./types";

/**
 * [Shield 3] (+3 Might while I'm a defender.)
 * [Tank] (I must be assigned combat damage first.)
 * When an opponent moves to a battlefield other than mine, draw 1. (Bases are not a battlefield.)
 *
 * [Shield]/[Tank] are printed keywords, already generic. The move-triggered draw is moot — this
 * engine has no "unit arrives at a battlefield" broadcast (the existing onMoveFromBattlefield
 * chokepoint only covers departure, and Ganking-driven attack-moves don't even go through it —
 * see move-helpers.ts). Building arrival tracking correctly would need to also cover the
 * attackBattlefield move path, not a small chokepoint fix (deferred, see docs/data-sourcing.md).
 */
export const volibearImposing: SpecialCaseHandler = {
  cardId: "volibear-imposing",
};
