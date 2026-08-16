import type { SpecialCaseHandler } from "./types";

/**
 * When you hold here, you may return your Chosen Champion from your trash to your Champion Zone
 * if it is empty.
 *
 * Moot — "Chosen Champion" and the "Champion Zone" aren't modeled; Champions sit on the board
 * like units in this engine (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const hallowedTomb: SpecialCaseHandler = {
  cardId: "hallowed-tomb",
};
