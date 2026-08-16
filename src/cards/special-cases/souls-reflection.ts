import type { SpecialCaseHandler } from "./types";

/**
 * When you empower something else, empower me.
 * Disempower me, Exhaust: Give a unit at a battlefield -2 Might this turn.
 *
 * Moot — "when you empower something else, empower me" was deliberately evaluated and skipped
 * earlier this session (deferred, see matriarch-of-war.ts's identical note). No fallback mode.
 */
export const soulsReflection: SpecialCaseHandler = {
  cardId: "souls-reflection",
};
