import type { SpecialCaseHandler } from "./types";

/**
 * [Accelerate] [Assault] (both generic keywords, already wired.)
 * Friendly units played from anywhere other than a player's hand have [Accelerate].
 *
 * "Played from anywhere other than a player's hand" isn't distinguishable from a normal play in
 * this engine (no generic "play source" tracking — see docs/data-sourcing.md). Nothing left to
 * implement once that grant is skipped.
 */
export const reksaiBreacher: SpecialCaseHandler = {
  cardId: "reksai-breacher",
};
