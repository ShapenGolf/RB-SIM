import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const MIGHT_THRESHOLD = 3;

/**
 * You may spend 5 XP as an additional cost to play this.
 * Choose an enemy unit at a battlefield with 3 Might or less. If you paid the additional cost,
 * choose any enemy unit at a battlefield instead. Take control of it, exhaust it, and recall
 * it.
 *
 * Known gap: the optional 5-XP cost to expand targeting to any enemy unit isn't wired up
 * (additionalCostXPForReduction is a cost-reduction hook, not a targeting-expansion one — see
 * docs/data-sourcing.md); always uses the baseline <=3 Might restriction. No player choice of
 * which eligible unit — takes the strongest one (best value).
 */
export const conscription: SpecialCaseHandler = {
  cardId: "conscription",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let best: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      const might = computeMight(ctx.game, getCard, instance, "none");
      if (might > MIGHT_THRESHOLD) continue;
      if (!best || might > computeMight(ctx.game, getCard, best, "none")) best = instance;
    }
    if (!best) return;

    if (best.battlefieldIndex !== null) {
      const slot = ctx.game.battlefields[best.battlefieldIndex];
      slot.units[enemyId] = slot.units[enemyId].filter((id) => id !== best!.instanceId);
    }
    best.controller = ctx.instance.controller;
    best.zone = "base";
    best.battlefieldIndex = null;
    best.exhausted = true;
    ctx.game.players[ctx.instance.controller].base.push(best.instanceId);
  },
};
