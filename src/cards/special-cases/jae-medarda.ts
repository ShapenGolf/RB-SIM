import type { SpecialCaseHandler } from "./types";

/**
 * When you choose me with a spell, draw 1.
 *
 * Moot — no generic "chosen as a spell's target" broadcast exists; most bespoke spell effects
 * auto-select targets internally rather than going through one centralized "choose" step this
 * engine could hook into (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const jaeMedarda: SpecialCaseHandler = {
  cardId: "jae-medarda",
};
