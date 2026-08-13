import type { SpecialCaseHandler } from "./types";

/** At the start of each player's first Beginning Phase, that player channels 1 rune. */
export const obeliskOfPower: SpecialCaseHandler = {
  cardId: "obelisk-of-power",
  onFirstBeginningPhase: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const rune = player.runeDeck.shift();
    if (rune) player.runePool.push(rune);
  },
};
