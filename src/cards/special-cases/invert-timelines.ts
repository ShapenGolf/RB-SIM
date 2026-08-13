import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { discardCardToTrash } from "../../game/discardEngine";

/** Each player discards their hand, then draws 4. */
export const invertTimelines: SpecialCaseHandler = {
  cardId: "invert-timelines",
  onPlay: (ctx) => {
    for (const playerId of ["0", "1"] as const) {
      const player = ctx.game.players[playerId];
      for (const cardId of [...player.hand]) {
        discardCardToTrash(ctx.game, getCard, playerId, cardId);
      }
      player.hand = [];
      for (let i = 0; i < 4; i += 1) {
        const drawn = player.mainDeck.shift();
        if (drawn) player.hand.push(drawn);
      }
    }
  },
};
