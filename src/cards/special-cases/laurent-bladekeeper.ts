import type { SpecialCaseHandler } from "./types";

/**
 * Ganking (I can move from battlefield to battlefield.)
 *
 * Data quirk: the official text has no "[Ganking]" bracket tag (just plain "Ganking (...)"), so
 * the import pipeline didn't recognize it as a printed keyword (`keywords: []` on this card) —
 * same class of bug as Bilgewater Bully/Fiora Victorious, but here the brackets are simply
 * missing rather than a bare unnumbered tag. Restored as an unconditional override.
 */
export const laurentBladekeeper: SpecialCaseHandler = {
  cardId: "laurent-bladekeeper",
  hasConditionalGanking: () => true,
};
