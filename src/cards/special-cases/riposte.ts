import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Choose a friendly unit and a spell. Counter that spell and give that unit +Might equal to that
 * spell's Energy cost this turn.
 *
 * Moot — entirely gated behind Counter, which isn't wired up (deferred, see abandon.ts's
 * identical note).
 */
export const riposte: SpecialCaseHandler = {
  cardId: "riposte",
};
