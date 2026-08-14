import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

const MIGHTY_THRESHOLD = 5;

/** [Deathknell] — If I was [Mighty], draw 2. I'm Mighty while I have 5+ Might. */
export const unsungHero: SpecialCaseHandler = {
  cardId: "unsung-hero",
  onDestroy: (ctx) => {
    if (computeMight(ctx.game, getCard, ctx.instance, "none") < MIGHTY_THRESHOLD) return;
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
