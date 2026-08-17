import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** When you play a card from face down, play a Gold gear token exhausted. */
export const blackMarketBroker: SpecialCaseHandler = {
  cardId: "black-market-broker",
  onAllyPlayFromHidden: (ctx) => {
    playTokenToBase(ctx.game, "token-gold-gear", ctx.instance.controller);
  },
};
