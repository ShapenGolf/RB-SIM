import type { SpecialCaseHandler } from "./types";

/**
 * When you ready a friendly unit, give it +1 Might this turn.
 *
 * Moot — this engine has no "became ready" broadcast (deferred, see mageseeker-warden.ts's
 * identical note). No fallback mode.
 */
export const piratesHaven: SpecialCaseHandler = {
  cardId: "pirates-haven",
};
