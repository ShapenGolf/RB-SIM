import type { SpecialCaseHandler } from "./types";

/**
 * Your opponents' [Hidden] cards can't be revealed here.
 *
 * Moot — this engine's Hidden zone (game/state.ts's `hiddenZone`) is a private, location-less
 * reserve (see mushroom-pouch.ts's identical note on the same simplification), so a Hidden card
 * has no "here" to be revealed at for this to restrict. No fallback mode.
 */
export const noxusSaboteur: SpecialCaseHandler = {
  cardId: "noxus-saboteur",
};
