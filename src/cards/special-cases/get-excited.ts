import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/** Discard 1. Deal its Energy cost as damage to a unit at a battlefield. */
export const getExcited: SpecialCaseHandler = {
  cardId: "get-excited",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    if (!ctx.game.instances[targetInstanceId]) return;
    const controller = ctx.game.players[ctx.instance.controller];
    const discardedId = controller.hand.shift();
    if (!discardedId) return;
    controller.trash.push(discardedId);
    controller.discardedCardThisTurn = true;
    const damage = getCard(discardedId).energyCost ?? 0;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, damage, ctx.instance.controller);
  },
};
