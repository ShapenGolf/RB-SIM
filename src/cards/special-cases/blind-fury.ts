import type { SpecialCaseHandler } from "./types";
import { playCardIgnoringCost } from "../../game/playFree";

/**
 * Each opponent reveals the top card of their Main Deck. Choose one and banish it, then play
 * it, ignoring its cost. Then recycle the rest. (1v1 simplification: there's only ever one
 * opponent and one revealed card, so the "choose one" / "recycle the rest" is a no-op.)
 */
export const blindFury: SpecialCaseHandler = {
  cardId: "blind-fury",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const opponentId = controller === "0" ? "1" : "0";
    const opponent = ctx.game.players[opponentId];
    const revealed = opponent.mainDeck.shift();
    if (!revealed) return;
    opponent.banishment.push(revealed);
    playCardIgnoringCost(ctx.game, controller, revealed);
  },
};
