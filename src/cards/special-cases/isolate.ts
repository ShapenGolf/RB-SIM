import type { SpecialCaseHandler } from "./types";

/** Move an enemy unit from a battlefield to its base. Then, if there's an enemy unit alone at that battlefield, draw 1. */
export const isolate: SpecialCaseHandler = {
  cardId: "isolate",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return;

    const battlefieldIndex = target.battlefieldIndex;
    const slot = ctx.game.battlefields[battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    target.zone = "base";
    target.battlefieldIndex = null;
    ctx.game.players[target.controller].base.push(targetInstanceId);

    if (slot.units[target.controller].length === 1) {
      const player = ctx.game.players[ctx.instance.controller];
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
