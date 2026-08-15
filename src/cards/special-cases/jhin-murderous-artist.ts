import type { SpecialCaseHandler } from "./types";

/**
 * [Deflect] [Ganking] (both generic keywords, already wired.)
 * When I move, [Add] 1 Energy Rune.
 *
 * The [Add] resource-generation keyword isn't wired up (~50 occurrences, deliberately not
 * built — see docs/data-sourcing.md). Nothing else left to implement once it's skipped.
 */
export const jhinMurderousArtist: SpecialCaseHandler = {
  cardId: "jhin-murderous-artist",
};
