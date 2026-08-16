import type { SpecialCaseHandler } from "./types";

/**
 * Each spell that chooses one or more units here that are friendly to it costs Rune less.
 *
 * Moot — the existing costReductionIfTargeted chokepoint (registry.ts) checks the TARGET's own
 * handler for a reduction, not a Battlefield's; extending it to also check the target's location
 * would need new plumbing not built this session (deferred, see docs/data-sourcing.md). No
 * fallback mode.
 */
export const sandsweptTomb: SpecialCaseHandler = {
  cardId: "sandswept-tomb",
};
