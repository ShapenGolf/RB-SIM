import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { createInstance } from "../../game/setup";

const MECH_BONUS = 1;

/** Your Mechs have +1 Might (including me). When I hold, play a 3 Might Mech unit token to your base. */
export const rumbleScrapper: SpecialCaseHandler = {
  cardId: "rumble-scrapper",
  staticMightModifier: (ctx) => (getCard(ctx.instance.cardId).tags?.includes("Mech") ? MECH_BONUS : 0),
  staticMightModifierForAlly: (_ctx, ally) =>
    getCard(ally.cardId).tags?.includes("Mech") ? MECH_BONUS : 0,
  onHold: (ctx) => {
    const controller = ctx.instance.controller;
    const token = createInstance(ctx.game, "token-mech-3", controller);
    ctx.game.players[controller].base.push(token.instanceId);
  },
};
