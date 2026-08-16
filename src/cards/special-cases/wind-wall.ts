import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell.
 *
 * Moot — entirely gated behind Counter, which isn't wired up (deferred, see abandon.ts's
 * identical note).
 */
export const windWall: SpecialCaseHandler = {
  cardId: "wind-wall",
};
