import type { SpecialCaseHandler } from "./types";

/** [Assault] [Deathknell] — Channel 1 rune exhausted. */
export const blackRoseDignitary: SpecialCaseHandler = {
  cardId: "black-rose-dignitary",
  onDestroy: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const rune = player.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      player.runePool.push(rune);
    }
  },
};
