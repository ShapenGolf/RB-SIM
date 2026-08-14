import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

const DAMAGE = 4;

/**
 * This can't be countered. Deal 4 to an enemy Calm (Calm Rune) unit.
 * "Can't be countered" is moot — Counter isn't a wired-up mechanic yet (see docs/data-sourcing.md) —
 * so this just always resolves, matching that simplification.
 */
export const decreeOfRage: SpecialCaseHandler = {
  cardId: "decree-of-rage",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    const targetCard = getCard(target.cardId);
    if ((targetCard.type !== "unit" && targetCard.type !== "champion") || !targetCard.domains.includes("Calm")) return;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, DAMAGE, ctx.instance.controller);
  },
};
