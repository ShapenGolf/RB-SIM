import type { SpecialCaseHandler } from "./types";

/** When I hold, if there is exactly one other unit you control here, draw 1. */
export const shenScourgeOfShadows: SpecialCaseHandler = {
  cardId: "shen-scourge-of-shadows",
  onHold: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const others = slot.units[ctx.instance.controller].filter((id) => id !== ctx.instance.instanceId);
    if (others.length !== 1) return;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
