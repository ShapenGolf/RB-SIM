import type { SpecialCaseHandler } from "./types";

/**
 * When I become ready, give me +2 Might this turn.
 *
 * Moot — this engine has no "became ready" broadcast; readying happens at ~55 scattered call
 * sites with no shared chokepoint (deferred, see mageseeker-warden.ts's identical note). No
 * fallback mode.
 */
export const fretfulFeline: SpecialCaseHandler = {
  cardId: "fretful-feline",
};
