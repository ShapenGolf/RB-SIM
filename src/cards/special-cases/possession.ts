import type { SpecialCaseHandler } from "./types";

/** Choose an enemy unit at a battlefield. Take control of it and recall it. (Send it to your base.) */
export const possession: SpecialCaseHandler = {
  cardId: "possession",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return;

    const oldSlot = ctx.game.battlefields[target.battlefieldIndex];
    oldSlot.units[target.controller] = oldSlot.units[target.controller].filter((id) => id !== targetInstanceId);
    target.controller = ctx.instance.controller;
    target.zone = "base";
    target.battlefieldIndex = null;
    ctx.game.players[ctx.instance.controller].base.push(targetInstanceId);
  },
};
