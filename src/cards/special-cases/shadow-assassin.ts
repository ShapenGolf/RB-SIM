import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** I enter ready if you have a card with my name in your trash. */
export const shadowAssassin: SpecialCaseHandler = {
  cardId: "shadow-assassin",
  selfEntersReady: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    return player.trash.some((id) => getCard(id).name === ctx.card.name);
  },
};
