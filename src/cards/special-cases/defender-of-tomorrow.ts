import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/**
 * [Empower] 2 Energy+Rune+Rune
 * 1 Energy, Exhaust: Ready a gear.
 * [Empowered] 1 Energy, Exhaust: Ready 2 gear.
 * Simplification: only the baseline (non-Empowered, ready 1) ability is wired up — see
 * docs/data-sourcing.md; Empower's own activation cost isn't a generic mechanic yet.
 */
export const defenderOfTomorrow: SpecialCaseHandler = {
  cardId: "defender-of-tomorrow",
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    if (getCard(target.cardId).type !== "gear") return;
    readyInstance(ctx.game, getCard, target.instanceId);
  },
};
