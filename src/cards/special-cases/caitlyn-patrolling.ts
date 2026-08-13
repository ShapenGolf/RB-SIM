import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";

/**
 * Exhaust: Deal damage equal to my Might to a unit at a battlefield. Use only while I'm at a
 * battlefield. Dynamic amount ("equal to my Might") isn't expressible as a fixed TemplatedAction,
 * hence bespoke rather than auto-matched.
 */
export const caitlynPatrolling: SpecialCaseHandler = {
  cardId: "caitlyn-patrolling",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (ctx.instance.battlefieldIndex === null) return; // "Use only while I'm at a battlefield."
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.battlefieldIndex === null) return;
    const amount = computeMight(ctx.game, getCard, ctx.instance, "none");
    target.damage += amount;
    const toughness = computeMight(ctx.game, getCard, target, "none");
    if (target.damage >= toughness) destroyInstance(ctx.game, getCard, targetInstanceId);
  },
};
