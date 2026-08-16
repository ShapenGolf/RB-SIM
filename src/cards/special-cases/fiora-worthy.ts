import type { SpecialCaseHandler } from "./types";

/**
 * When a unit you control becomes [Mighty], you may pay Order Rune to ready it. (A unit is
 * Mighty while it has 5+ Might.)
 *
 * Moot — "becomes Mighty" is a state TRANSITION (crossing the 5+ Might threshold), and Might is
 * computed dynamically from static/temporary modifiers rather than tracked as a discrete event
 * this engine can hook into (no "Might changed" chokepoint exists) — deferred, see
 * docs/data-sourcing.md. No fallback mode.
 */
export const fioraWorthy: SpecialCaseHandler = {
  cardId: "fiora-worthy",
};
