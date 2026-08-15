import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const LOOK_COUNT = 3;

/**
 * Look at the top 3 cards of your Main Deck. You may choose a card from among them and draw
 * it. Put the rest into your trash.
 * Flow (play from trash for its Flow cost, then banish) isn't wired up yet — see
 * docs/data-sourcing.md; this covers the card's baseline effect.
 *
 * Simplification: no player choice — draws the highest-Energy-cost card among the 3 (usually
 * the best value), trashes the rest.
 */
export const lightningRush: SpecialCaseHandler = {
  cardId: "lightning-rush",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const looked = Array.from({ length: LOOK_COUNT }, () => player.mainDeck.shift()).filter(
      (id): id is string => Boolean(id),
    );
    if (looked.length === 0) return;
    looked.sort((a, b) => (getCard(b).energyCost ?? 0) - (getCard(a).energyCost ?? 0));
    const [drawn, ...rest] = looked;
    player.hand.push(drawn);
    player.trash.push(...rest);
  },
};
