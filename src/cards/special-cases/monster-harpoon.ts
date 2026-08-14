import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

const DAMAGE = 2;

/**
 * [Action] Deal 2 to a unit at a battlefield. If you control a facedown card, deal 4 to it
 * instead.
 *
 * The Hidden keyword (facedown cards) isn't modeled in this engine (see docs/data-sourcing.md),
 * so no player can ever "control a facedown card" — the conditional 4-damage branch can never
 * trigger, making the plain 2-damage effect fully accurate rather than a simplification.
 */
export const monsterHarpoon: SpecialCaseHandler = {
  cardId: "monster-harpoon",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield") return;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, DAMAGE, ctx.instance.controller);
  },
};
