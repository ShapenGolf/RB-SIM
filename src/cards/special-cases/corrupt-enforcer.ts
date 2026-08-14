import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { discardCardToTrash } from "../../game/discardEngine";

/** When I move to a battlefield, discard 1. When I win a combat, draw 1. */
export const corruptEnforcer: SpecialCaseHandler = {
  cardId: "corrupt-enforcer",
  onMove: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const discardedId = player.hand.shift();
    if (discardedId) discardCardToTrash(ctx.game, getCard, ctx.instance.controller, discardedId);
  },
  onSurviveCombat: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
