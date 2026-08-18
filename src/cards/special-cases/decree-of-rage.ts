import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

const DAMAGE = 4;

/**
 * This can't be countered. Deal 4 to an enemy Calm (Calm Rune) unit.
 */
export const decreeOfRage: SpecialCaseHandler = {
  cardId: "decree-of-rage",
  needsPlayTarget: true,
  // The pending spell's own instance is still sitting in game.instances, controlled by its
  // caster, at counter-check time (see PendingSpellReaction) — so checking "is this ME" via the
  // normal preventsCounter broadcast (which scans the caster's own instances) protects this card
  // from countering itself, with no special-casing needed in moves.ts.
  preventsCounterFor: (ctx, pending) => ctx.instance.instanceId === pending.instanceId,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    const targetCard = getCard(target.cardId);
    if ((targetCard.type !== "unit" && targetCard.type !== "champion") || !targetCard.domains.includes("Calm")) return;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, DAMAGE, ctx.instance.controller);
  },
};
