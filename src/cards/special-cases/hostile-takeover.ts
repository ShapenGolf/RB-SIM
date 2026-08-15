import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] Take control of an enemy unit at a battlefield. Ready it. (Start a combat if other
 * enemies are there. Otherwise, conquer.) Lose control of that unit and recall it at end of
 * turn. (Send it to base. This isn't a move.)
 *
 * Known gaps: the "ready it, trigger combat/conquer" clause and the end-of-turn reversion aren't
 * modeled (no generic "control reverts later" tracking, and manually re-triggering combat
 * resolution from inside an onPlay hook is out of scope — see docs/data-sourcing.md). Only a
 * permanent control transfer is implemented, matching possession.ts's precedent.
 */
export const hostileTakeover: SpecialCaseHandler = {
  cardId: "hostile-takeover",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return;

    const slot = ctx.game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    target.controller = ctx.instance.controller;
    slot.units[ctx.instance.controller].push(targetInstanceId);
  },
};
