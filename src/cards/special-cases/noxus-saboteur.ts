import type { SpecialCaseHandler } from "./types";

/**
 * Your opponents' [Hidden] cards can't be revealed here.
 *
 * Moot — [Hidden]/facedown state isn't modeled (deferred, see mushroom-pouch.ts's identical
 * note). No fallback mode.
 */
export const noxusSaboteur: SpecialCaseHandler = {
  cardId: "noxus-saboteur",
};
