import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";
import { computeMight } from "../../game/might";

/** Discard 1. Deal its Energy cost as damage to a unit at a battlefield. */
export const getExcited: SpecialCaseHandler = {
  cardId: "get-excited",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    const controller = ctx.game.players[ctx.instance.controller];
    const discardedId = controller.hand.shift();
    if (!discardedId) return;
    controller.trash.push(discardedId);
    controller.discardedCardThisTurn = true;
    const damage = getCard(discardedId).energyCost ?? 0;
    target.damage += damage;
    const toughness = computeMight(ctx.game, getCard, target, "none");
    if (target.damage >= toughness) {
      destroyInstance(ctx.game, getCard, targetInstanceId);
    }
  },
};
