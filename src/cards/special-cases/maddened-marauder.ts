import type { SpecialCaseHandler } from "./types";

/** [Tank] When you play me, move a unit from a battlefield to its base. */
export const maddenedMarauder: SpecialCaseHandler = {
  cardId: "maddened-marauder",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield" || target.battlefieldIndex === null) return;

    const slot = ctx.game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    target.zone = "base";
    target.battlefieldIndex = null;
    ctx.game.players[target.controller].base.push(targetInstanceId);
  },
};
