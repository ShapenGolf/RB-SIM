import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";

const DAMAGE = 3;

/** Fury Rune, Exhaust: Deal 3 to a unit. Use this ability only while I'm at a battlefield. */
export const xerathFreed: SpecialCaseHandler = {
  cardId: "xerath-freed",
  activatedAbilityCost: { energy: 0, runeDomain: "Fury", exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (ctx.instance.battlefieldIndex === null) return; // "Use this ability only while I'm at a battlefield."
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.damage += DAMAGE;
    const toughness = computeMight(ctx.game, getCard, target, "none");
    if (target.damage >= toughness) destroyInstance(ctx.game, getCard, targetInstanceId);
  },
};
