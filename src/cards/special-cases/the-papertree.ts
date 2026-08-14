import type { SpecialCaseHandler } from "./types";
import type { PlayerId } from "../../game/state";

/** When you hold here, each player channels 1 rune exhausted. */
export const thePapertree: SpecialCaseHandler = {
  cardId: "the-papertree",
  onBeginningWhileHeld: (ctx) => {
    for (const playerId of ["0", "1"] as PlayerId[]) {
      const player = ctx.game.players[playerId];
      const rune = player.runeDeck.shift();
      if (rune) {
        rune.exhausted = true;
        player.runePool.push(rune);
      }
    }
  },
};
