import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * You may pay 1 Energy+Fury Rune as an additional cost to play me. When you play me, if you
 * paid the additional cost, deal 2 to a unit at a battlefield.
 *
 * Simplification: the Domain-Rune part of the additional cost is not charged, only the Energy
 * (same precedent as the Accelerate keyword — see cards/special-cases/types.ts
 * `additionalPlayCostEnergy`). No player choice of which unit.
 */
export const blastCorpsCadet: SpecialCaseHandler = {
  cardId: "blast-corps-cadet",
  additionalPlayCostEnergy: () => 1,
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    const target = Object.values(ctx.game.instances).find((i) => i.zone === "battlefield");
    if (!target) return;
    dealSpellDamage(ctx.game, getCard, target.instanceId, 2, ctx.instance.controller);
  },
};
