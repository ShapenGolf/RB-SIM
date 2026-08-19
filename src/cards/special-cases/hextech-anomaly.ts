import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — Pay any amount of Rune to [Add] that much Energy. (Abilities that add
 * resources can't be reacted to.)
 *
 * Same "pay any amount" blocker as ancient-henge.ts's identical note — [Add] itself is not the
 * problem, a variable player-chosen amount is.
 */
export const hextechAnomaly: SpecialCaseHandler = {
  cardId: "hextech-anomaly",
};
