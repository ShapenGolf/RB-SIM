import type { SpecialCaseHandler } from "./types";

const SHIELD_AMOUNT = 3;

/**
 * [Hidden] I have [Shield 3] while I'm at a battlefield with exactly one other unit you control.
 *
 * [Hidden]'s face-down timing isn't modeled — the conditional Shield always applies once
 * eligible.
 */
export const discipleOfShen: SpecialCaseHandler = {
  cardId: "disciple-of-shen",
  defendingMightModifier: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return 0;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const otherFriendlyCount = slot.units[ctx.instance.controller].filter((id) => id !== ctx.instance.instanceId).length;
    return otherFriendlyCount === 1 ? SHIELD_AMOUNT : 0;
  },
};
