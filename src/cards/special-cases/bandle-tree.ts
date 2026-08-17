import type { SpecialCaseHandler } from "./types";

/**
 * You may hide an additional card here.
 *
 * Moot — this engine's Hidden zone (game/state.ts's `hiddenZone`) has no per-location cap to
 * begin with (any number of cards can be hidden), so there's no limit for this card to lift.
 * No fallback mode.
 */
export const bandleTree: SpecialCaseHandler = {
  cardId: "bandle-tree",
};
