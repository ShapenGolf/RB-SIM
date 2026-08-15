import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/** [Ambush] When you play me, deal damage to a unit equal to the damage marked on it. */
export const morganaVindictive: SpecialCaseHandler = {
  cardId: "morgana-vindictive",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    const amount = target.damage;
    if (amount <= 0) return;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, amount, ctx.instance.controller);
  },
};
