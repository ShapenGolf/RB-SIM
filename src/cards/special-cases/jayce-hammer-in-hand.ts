import type { SpecialCaseHandler } from "./types";

/**
 * When I become ready, choose one to give me this turn — [Assault 2] / [Deflect 2] / [Ganking].
 *
 * Moot — this engine has no "became ready" broadcast (deferred, see mageseeker-warden.ts's
 * identical note). No fallback mode.
 */
export const jayceHammerInHand: SpecialCaseHandler = {
  cardId: "jayce-hammer-in-hand",
};
