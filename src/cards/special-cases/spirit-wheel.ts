import type { SpecialCaseHandler } from "./types";

/**
 * When you choose a friendly unit, you may pay 1 Energy and exhaust this to draw 1.
 *
 * Moot — no generic "chosen as a target" broadcast exists; most bespoke effects auto-select
 * targets internally rather than going through one centralized "choose" step this engine could
 * hook into (deferred, see jae-medarda.ts's identical note). No fallback mode.
 */
export const spiritWheel: SpecialCaseHandler = {
  cardId: "spirit-wheel",
};
