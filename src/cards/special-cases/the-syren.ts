import type { SpecialCaseHandler } from "./types";

/** 1 Energy, Exhaust: Move a friendly unit at a battlefield to your base. */
export const theSyren: SpecialCaseHandler = {
  cardId: "the-syren",
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return;

    const slot = ctx.game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    target.zone = "base";
    target.battlefieldIndex = null;
    ctx.game.players[target.controller].base.push(targetInstanceId);
  },
};
