import type { SpecialCaseHandler } from "./types";

/**
 * I have +1 Might for each of your units with [Temporary] at my battlefield.
 *
 * Data quirk: the import pipeline attributed the reminder text's "[Temporary]" (which describes
 * OTHER units, not itself) to Petal Pixie's own printed keywords, so createInstance wrongly
 * marks her statuses.temporary — same class of bug as Sprite Queen (see sprite-queen.ts) and
 * Laurent Bladekeeper's missing Ganking brackets. Cleared in onPlay; the Might count also
 * excludes herself as a belt-and-suspenders guard.
 */
export const petalPixie: SpecialCaseHandler = {
  cardId: "petal-pixie",
  onPlay: (ctx) => {
    ctx.instance.statuses.temporary = false;
  },
  staticMightModifier: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return 0;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const ids = slot.units[ctx.instance.controller] ?? [];
    let count = 0;
    for (const id of ids) {
      if (id === ctx.instance.instanceId) continue;
      if (ctx.game.instances[id]?.statuses.temporary) count += 1;
    }
    return count;
  },
};
