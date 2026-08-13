import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/** Deal 3 to a unit at a battlefield. If this kills it, draw 1. */
export const disintegrate: SpecialCaseHandler = {
  cardId: "disintegrate",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    if (!ctx.game.instances[targetInstanceId]) return;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, 3, ctx.instance.controller);
    if (!ctx.game.instances[targetInstanceId]) {
      const controller = ctx.game.players[ctx.instance.controller];
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    }
  },
};
