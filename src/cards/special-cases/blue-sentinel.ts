import type { SpecialCaseHandler } from "./types";

/**
 * [Shield 2] (printed keyword, already wired generically.)
 * Your hold effects for holding here trigger an additional time.
 * When I hold, [Add] Rune at the start of your next Main Phase.
 *
 * Known gaps: re-triggering every onHold hook an additional time isn't modeled (a location-wide
 * effect-doubler — same category as red-brambleback.ts's conquer-doubling gap), and the [Add]
 * resource-generation keyword isn't wired up at all (~50 occurrences, deliberately not built —
 * see docs/data-sourcing.md). Nothing left to implement once both are skipped.
 */
export const blueSentinel: SpecialCaseHandler = {
  cardId: "blue-sentinel",
};
