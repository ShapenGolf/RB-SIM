import type { SpecialCaseHandler } from "./types";

/** Return a friendly unit to its owner's hand. Its owner channels 1 rune exhausted. */
export const retreat: SpecialCaseHandler = {
  cardId: "retreat",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;

    if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
      const slot = ctx.game.battlefields[target.battlefieldIndex];
      slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    } else {
      const owner = ctx.game.players[target.controller];
      owner.base = owner.base.filter((id) => id !== targetInstanceId);
    }
    delete ctx.game.instances[targetInstanceId];
    const owner = ctx.game.players[target.controller];
    owner.hand.push(target.cardId);

    const rune = owner.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      owner.runePool.push(rune);
    }
  },
};
