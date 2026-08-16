import type { SpecialCaseHandler } from "./types";

/**
 * While I'm at a battlefield, opponents can only play units to their base.
 * While I'm at a battlefield, spells and abilities can't ready enemy units and gear.
 *
 * Only the first clause is implemented — uses the new blocksUnitsPlayedByOpponentHere hook
 * (registry.ts blocksUnitsPlayedHere, now also scanning units at the location, not just the
 * Battlefield card). The second clause ("can't ready enemy units and gear") is moot: readying
 * happens at ~55 scattered call sites across this engine with no single chokepoint to hook
 * (deferred, see docs/data-sourcing.md).
 */
export const mageseekerWarden: SpecialCaseHandler = {
  cardId: "mageseeker-warden",
  blocksUnitsPlayedByOpponentHere: (ctx, attemptingPlayer) => attemptingPlayer !== ctx.instance.controller,
};
