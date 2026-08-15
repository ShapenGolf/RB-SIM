import type { SpecialCaseHandler } from "./types";

/**
 * I cost 2 Energy less to play from anywhere other than your hand.
 *
 * "Played from anywhere other than hand" isn't distinguishable from a normal play in this engine
 * (no generic "play source" tracking — see docs/data-sourcing.md). Effects that already play this
 * card via playCardIgnoringCost bypass its cost entirely, making this reduction moot in practice.
 */
export const voidDrone: SpecialCaseHandler = {
  cardId: "void-drone",
};
