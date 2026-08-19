import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * While I'm at a battlefield, opponents can only play units to their base.
 * While I'm at a battlefield, spells and abilities can't ready enemy units and gear.
 *
 * First clause uses blocksUnitsPlayedByOpponentHere (registry.ts blocksUnitsPlayedHere, now also
 * scanning units at the location, not just the Battlefield card). Second clause uses
 * preventsReadyByEffect (see ready-helpers.ts readyInstance) — scoped to effect-driven readying
 * only, per that hook's own doc comment, so this does NOT block the enemy's normal Awaken
 * readying (which isn't "spells and abilities").
 */
export const mageseekerWarden: SpecialCaseHandler = {
  cardId: "mageseeker-warden",
  blocksUnitsPlayedByOpponentHere: (ctx, attemptingPlayer) => attemptingPlayer !== ctx.instance.controller,
  preventsReadyByEffect: (ctx, target) => {
    if (ctx.instance.zone !== "battlefield") return false;
    if (target.controller === ctx.instance.controller) return false;
    const type = getCard(target.cardId).type;
    return type === "unit" || type === "champion" || type === "gear";
  },
};
