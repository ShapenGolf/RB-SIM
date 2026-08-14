import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** 1 Energy, Exhaust: Return a friendly unit at a battlefield to its owner's hand. Play a Gold gear token exhausted. */
export const bloodharborRipper: SpecialCaseHandler = {
  cardId: "bloodharbor-ripper",
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return;

    const slot = ctx.game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    ctx.game.players[target.controller].hand.push(target.cardId);
    delete ctx.game.instances[targetInstanceId];

    const token = playTokenToBase(ctx.game, "token-gold-gear", ctx.instance.controller);
    token.exhausted = true;
  },
};
