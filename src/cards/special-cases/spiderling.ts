import type { SpecialCaseHandler } from "./types";

const MIGHT_PER_COPY = 1;

/**
 * [Hidden] I have +1 Might for each other unit you control here with my name. Your deck can have
 * any number of cards named Spiderling.
 *
 * The deck-building rule (no 1-copy limit) isn't relevant to runtime play. [Hidden]'s face-down
 * timing isn't modeled.
 */
export const spiderling: SpecialCaseHandler = {
  cardId: "spiderling",
  staticMightModifier: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return 0;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const copies = slot.units[ctx.instance.controller].filter(
      (id) => id !== ctx.instance.instanceId && ctx.game.instances[id]?.cardId === ctx.instance.cardId,
    ).length;
    return copies * MIGHT_PER_COPY;
  },
};
