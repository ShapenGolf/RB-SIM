import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/** Kill a gear. Its controller draws 2. */
export const detonate: SpecialCaseHandler = {
  cardId: "detonate",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || getCard(target.cardId).type !== "gear") return;
    const owner = target.controller;
    destroyInstance(ctx.game, getCard, targetInstanceId);
    const player = ctx.game.players[owner];
    for (let i = 0; i < 2; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
