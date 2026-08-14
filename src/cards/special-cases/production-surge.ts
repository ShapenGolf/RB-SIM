import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { createInstance } from "../../game/setup";

/** This costs 2 Energy less if you control a Mech. Play a 3 Might Mech unit token to your base. Draw 1. */
export const productionSurge: SpecialCaseHandler = {
  cardId: "production-surge",
  costReduction: (ctx) => {
    const hasMech = Object.values(ctx.game.instances).some(
      (i) => i.controller === ctx.instance.controller && (getCard(i.cardId).tags?.includes("Mech") ?? false),
    );
    return hasMech ? 2 : 0;
  },
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const token = createInstance(ctx.game, "token-mech-3", controller);
    ctx.game.players[controller].base.push(token.instanceId);
    const player = ctx.game.players[controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
