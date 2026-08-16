import type { SpecialCaseHandler } from "./types";

/**
 * This enters exhausted.
 * [Reaction][>] Exhaust: [Add] Rune. (Abilities that add resources can't be reacted to.)
 * [Level 6][>] [>>][Reaction][>] Exhaust: [Add] 1 Energy/Rune. (Use this ability only while you
 * have 6+ XP.)
 *
 * "Enters exhausted" needs no special case — game/moves.ts resolvePlayedCard already defaults
 * `exhausted = !entersReady`, and nothing here grants entersReady. Both [Add] abilities are moot
 * (deferred, see ancient-henge.ts's identical note) — no observable fallback.
 */
export const honeyfruit: SpecialCaseHandler = {
  cardId: "honeyfruit",
};
