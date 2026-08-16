import type { SpecialCaseHandler } from "./types";

/**
 * I have all Exhaust abilities of all friendly legends, units, and gear.
 *
 * Moot — full ability-sharing/copying isn't modeled; this would require a live, continuously-
 * updated union of every other friendly card's activated-ability cost/effect, layered on top of
 * this instance's own (deferred, see docs/data-sourcing.md — same category as Svellsongur/Shady
 * Spectacles/The Zero Drive's ability-copying). No fallback mode.
 */
export const heimerdingerInventor: SpecialCaseHandler = {
  cardId: "heimerdinger-inventor",
};
