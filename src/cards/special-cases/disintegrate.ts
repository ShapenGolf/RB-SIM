import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";
import { computeMight } from "../../game/might";

/** Deal 3 to a unit at a battlefield. If this kills it, draw 1. */
export const disintegrate: SpecialCaseHandler = {
  cardId: "disintegrate",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.damage += 3;
    const toughness = computeMight(ctx.game, getCard, target, "none");
    if (target.damage >= toughness) {
      destroyInstance(ctx.game, getCard, targetInstanceId);
      const controller = ctx.game.players[ctx.instance.controller];
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    }
  },
};
